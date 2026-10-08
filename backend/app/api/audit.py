"""
Audit & Non-Hallucination Verification API Router.
Provides admin access to immutable audit records and SHA-256 integrity checks.
"""
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models import TicketAudit, Ticket
from backend.app.schemas import AuditEventResponse
from backend.app.services.audit import audit_service

router = APIRouter(prefix="/audit", tags=["Audit Trail"])

@router.get("", response_model=List[AuditEventResponse])
def get_audit_logs(
    ticket_id: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """Query immutable audit events with optional ticket filtering."""
    query = db.query(TicketAudit)
    if ticket_id:
        query = query.filter(TicketAudit.ticket_id == ticket_id)
    if action:
        query = query.filter(TicketAudit.action == action)
    
    events = query.order_by(TicketAudit.timestamp.desc()).limit(limit).all()
    results = []
    for e in events:
        details = {}
        if e.details_json:
            try:
                details = json.loads(e.details_json)
            except Exception:
                details = {"raw": e.details_json}
        results.append({
            "audit_id": e.audit_id,
            "ticket_id": e.ticket_id,
            "user_id": e.user_id,
            "action": e.action,
            "timestamp": e.timestamp,
            "ticket_hash": e.ticket_hash,
            "details": details
        })
    return results


@router.get("/verify-hash/{ticket_id}")
def verify_ticket_provenance_hash(ticket_id: str, db: Session = Depends(get_db)):
    """
    Non-Hallucination Proof Verification (Guardrails Section 2).
    Re-computes the SHA-256 hash on current ticket content and compares against stored hash.
    """
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    recomputed = audit_service.compute_sha256(ticket.description)
    is_valid = (recomputed == ticket.raw_sha256)

    return {
        "ticket_id": ticket.id,
        "stored_hash": ticket.raw_sha256,
        "recomputed_hash": recomputed,
        "is_provenance_verified": is_valid,
        "tamper_detected": not is_valid,
        "status": "VALID" if is_valid else "TAMPERED"
    }
