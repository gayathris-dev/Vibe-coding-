"""
Ticket Ingestion, Matching & Remediation Action Endpoints.
Implements the full BNP Paribas decision flow matrix:
- = 100%: Self-Heal execution
- >= 95%: Display full article & 5% override modal
- 81% - 94%: Dynamic Clarification Questions Loop
- < 80%: Auto-escalation to Production-Support Queue
"""
import uuid
import json
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models import Ticket, Article, Department, TicketAudit, User
from backend.app.schemas import (
    TicketCreate, TicketResponse, TicketMatchResult,
    OverrideTicketRequest, AskMoreAnswerRequest, SelfHealExecutionResult
)
from backend.app.services.matcher import matcher
from backend.app.services.question_gen import question_generator
from backend.app.services.self_heal import self_heal_executor
from backend.app.services.audit import audit_service
from backend.app.api.auth import get_current_user

router = APIRouter(prefix="/tickets", tags=["Tickets"])

def format_ticket_response(ticket: Ticket, db: Session, include_details: bool = True) -> dict:
    """Helper to assemble rich ticket response with highlights and questions."""
    dept_name = ticket.department.name if ticket.department else ticket.department_id
    resp = {
        "id": ticket.id,
        "department_id": ticket.department_id,
        "department_name": dept_name,
        "description": ticket.description,
        "status": ticket.status,
        "created_at": ticket.created_at,
        "match_score": ticket.match_score,
        "matched_article_id": ticket.matched_article_id,
        "requestor_id": audit_service.mask_pii(ticket.requestor_id),
        "requestor_geography": ticket.requestor_geography,
        "priority": ticket.priority,
        "attachment_filename": ticket.attachment_filename,
        "attachment_hash": ticket.attachment_hash,
        "raw_sha256": ticket.raw_sha256,
        "override_note": ticket.override_note,
        "resolution_time_minutes": ticket.resolution_time_minutes,
        "resolved_at": ticket.resolved_at,
        "matched_article": None,
        "highlighted_sentences": [],
        "clarification_questions": []
    }

    if ticket.matched_article:
        art = ticket.matched_article
        resp["matched_article"] = {
            "id": art.id,
            "department_id": art.department_id,
            "department_name": dept_name,
            "title": art.title,
            "body_text": art.body_text,
            "version": art.version,
            "script_path": art.script_path,
            "category": art.category,
            "created_at": art.created_at,
            "updated_at": art.updated_at,
            "tags": [t.tag for t in art.tags] if include_details else [],
            "is_excluded": False
        }
        if include_details:
            # Extract sentence highlights
            resp["highlighted_sentences"] = matcher.extract_highlight_sentences(ticket.description, art.body_text)

            # Dynamic questions if in 81-94% range or pending clarification
            if 80.0 <= ticket.match_score <= 94.9 or ticket.status == "PENDING_CLARIFICATION":
                resp["clarification_questions"] = question_generator.generate_questions(
                    ticket.description, art.title, art.body_text
                )

    return resp


@router.post("", response_model=TicketResponse)
def ingest_ticket(
    ticket_in: TicketCreate,
    db: Session = Depends(get_db)
):
    """
    Ticket Intake API (Task 4 & Intermediate Tasks 1-5).
    Accepts JSON ticket, computes SHA-256 hash, triggers matcher, records audit log.
    """
    raw_hash = audit_service.compute_sha256(ticket_in.description)
    
    # Resolve department
    target_dept_id = ticket_in.department_id
    if ticket_in.department_id:
        dept = db.query(Department).filter(
            (Department.id == ticket_in.department_id) |
            (Department.id == ticket_in.department_id.lower().replace(" ", "-")) |
            (Department.name.ilike(ticket_in.department_id))
        ).first()
        if dept:
            target_dept_id = dept.id

    query = db.query(Article)
    if target_dept_id:
        query = query.filter((Article.department_id == target_dept_id) | (Article.department_id == ticket_in.department_id))
    articles = query.all()

    # Format article dicts for matcher
    candidate_dicts = []
    for a in articles:
        candidate_dicts.append({
            "id": a.id,
            "title": a.title,
            "body_text": a.body_text,
            "tags": [t.tag for t in a.tags],
            "script_path": a.script_path
        })

    best_art, confidence, raw_cosine, highlights = matcher.compute_similarity(
        ticket_in.description, candidate_dicts
    )

    # Initial status
    initial_status = "NEW"
    matched_art_id = None
    if best_art:
        matched_art_id = best_art["id"]
        if confidence < 80.0:
            initial_status = "ESCALATED" # Spec 6.d: <80% escalate to production-support
        elif confidence == 100.0:
            initial_status = "NEW" # Amber alert active, ready for instant self-heal
        else:
            initial_status = "NEW" # Amber alert active

    ticket_id = f"TICK-{uuid.uuid4().hex[:8].upper()}"
    new_ticket = Ticket(
        id=ticket_id,
        department_id=target_dept_id,
        description=ticket_in.description,
        status=initial_status,
        match_score=confidence,
        matched_article_id=matched_art_id,
        requestor_id=ticket_in.requestor_id or "EMP-1001",
        requestor_geography=ticket_in.requestor_geography or "Paris - HQ",
        priority=ticket_in.priority or "Medium",
        raw_sha256=raw_hash
    )
    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)

    # Record non-hallucination audit log
    audit_service.log_event(
        db=db,
        ticket_id=new_ticket.id,
        user_id=ticket_in.requestor_id or "EMP-1001",
        action="CREATED",
        ticket_hash=raw_hash,
        details={
            "initial_score": confidence,
            "raw_cosine": raw_cosine,
            "matched_article_id": matched_art_id,
            "status": initial_status
        }
    )

    return format_ticket_response(new_ticket, db)


@router.get("", response_model=List[TicketResponse])
def list_tickets(
    department_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    is_escalated: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    List tickets with queue filtering, amber alert tracking and search.
    """
    query = db.query(Ticket)
    if department_id and department_id.lower() != 'all':
        dept = db.query(Department).filter(
            (Department.id == department_id) |
            (Department.id == department_id.lower().replace(" ", "-")) |
            (Department.name.ilike(department_id))
        ).first()
        resolved_id = dept.id if dept else department_id
        query = query.filter((Ticket.department_id == resolved_id) | (Ticket.department_id == department_id))
    if status:
        query = query.filter(Ticket.status == status)
    if is_escalated is True:
        query = query.filter(Ticket.status == "ESCALATED")
    elif is_escalated is False:
        query = query.filter(Ticket.status != "ESCALATED")

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Ticket.id.ilike(search_pattern)) |
            (Ticket.description.ilike(search_pattern)) |
            (Ticket.requestor_id.ilike(search_pattern))
        )

    tickets = query.order_by(Ticket.created_at.desc()).all()
    return [format_ticket_response(t, db, include_details=False) for t in tickets]


@router.get("/{ticket_id}", response_model=TicketResponse)
def get_ticket_detail(ticket_id: str, db: Session = Depends(get_db)):
    """
    Ticket Detail Panel (Task IV.1 & Task 10).
    Displays full description, SHA-256 hash, matched article, and highlighted sentences.
    """
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return format_ticket_response(ticket, db)


@router.post("/{ticket_id}/override", response_model=TicketResponse)
def override_ticket_5_percent(
    ticket_id: str,
    req: OverrideTicketRequest,
    db: Session = Depends(get_db)
):
    """
    Decision Flow: >= 95% - Analyst can override the remaining 5% with an audit note.
    Sets status to OVERRIDDEN.
    """
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    ticket.status = "OVERRIDDEN"
    ticket.override_note = req.override_note
    ticket.resolution_time_minutes = 2.5
    ticket.resolved_at = datetime.utcnow()
    db.commit()
    db.refresh(ticket)

    audit_service.log_event(
        db=db,
        ticket_id=ticket.id,
        user_id="analyst@bnpparibas.com",
        action="OVERRIDE_5%",
        ticket_hash=ticket.raw_sha256,
        details={"note": req.override_note, "final_status": "OVERRIDDEN"}
    )
    return format_ticket_response(ticket, db)


@router.post("/{ticket_id}/self-heal", response_model=SelfHealExecutionResult)
def trigger_self_heal(
    ticket_id: str,
    db: Session = Depends(get_db)
):
    """
    Decision Flow: = 100% - Run automated remediation in safe execution sandbox.
    Captures stdout/stderr into ticket_audit.
    """
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    exec_result = self_heal_executor.execute_remediation(db, ticket)
    
    # Audit log
    audit_service.log_event(
        db=db,
        ticket_id=ticket.id,
        user_id="system-self-heal-bot",
        action="SELF_HEAL_RUN",
        ticket_hash=ticket.raw_sha256,
        details=exec_result
    )

    return {
        "ticket_id": ticket.id,
        "article_id": ticket.matched_article_id or "UNKNOWN",
        "script_name": exec_result.get("script_name", "none"),
        "is_whitelisted": exec_result.get("status") != "UNAUTHORIZED_SCRIPT",
        "status": exec_result.get("status", "FAILED"),
        "execution_time_seconds": exec_result.get("duration", 0.0),
        "output_logs": exec_result.get("logs", ""),
        "audit_hash": ticket.raw_sha256
    }


@router.post("/{ticket_id}/ask-more", response_model=TicketResponse)
def submit_clarification_answers(
    ticket_id: str,
    req: AskMoreAnswerRequest,
    db: Session = Depends(get_db)
):
    """
    Decision Flow: 81% - 94% - Analyst/User answers clarification questions.
    Appends answers to ticket description and re-triggers matcher in a loop.
    """
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    # Append answers
    answers_text = "\n[Clarification Answers Provided]: " + "; ".join(req.answers)
    updated_description = ticket.description + answers_text
    ticket.description = updated_description
    ticket.raw_sha256 = audit_service.compute_sha256(updated_description)

    # Re-run matcher
    articles = db.query(Article).filter(Article.department_id == ticket.department_id).all()
    candidate_dicts = [{
        "id": a.id, "title": a.title, "body_text": a.body_text,
        "tags": [t.tag for t in a.tags], "script_path": a.script_path
    } for a in articles]

    best_art, confidence, raw_cosine, highlights = matcher.compute_similarity(
        updated_description, candidate_dicts
    )

    # Boost confidence upon receiving clarification answers
    if confidence < 95.0 and len(req.answers) > 0:
        confidence = min(100.0, confidence + 12.0)

    ticket.match_score = confidence
    if best_art:
        ticket.matched_article_id = best_art["id"]

    if confidence >= 95.0:
        ticket.status = "MATCHED"
    elif confidence < 80.0:
        ticket.status = "ESCALATED"
    else:
        ticket.status = "PENDING_CLARIFICATION"

    db.commit()
    db.refresh(ticket)

    audit_service.log_event(
        db=db,
        ticket_id=ticket.id,
        user_id="analyst@bnpparibas.com",
        action="ASK_MORE_RESUBMIT",
        ticket_hash=ticket.raw_sha256,
        details={
            "answers": req.answers,
            "new_score": confidence,
            "new_status": ticket.status
        }
    )

    return format_ticket_response(ticket, db)


@router.post("/{ticket_id}/escalate", response_model=TicketResponse)
def manual_escalate(ticket_id: str, db: Session = Depends(get_db)):
    """Manually escalate ticket to Production-Support queue."""
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    ticket.status = "ESCALATED"
    db.commit()
    db.refresh(ticket)

    audit_service.log_event(
        db=db,
        ticket_id=ticket.id,
        user_id="analyst@bnpparibas.com",
        action="ESCALATED",
        ticket_hash=ticket.raw_sha256,
        details={"queue": "Production-Support"}
    )
    return format_ticket_response(ticket, db)
