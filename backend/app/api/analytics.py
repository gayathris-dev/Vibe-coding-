"""
Analytics, Accuracy Metrics & Compliance Reporting Router.
Implements:
- Overall accuracy & 4x4 Confusion Matrix (Spec Tasks IV, VII.9)
- Financial ROI & Cost-Avoidance calculation
- PDF Compliance Report generation (ReportLab)
- Raw dataset CSV export with non-hallucination SHA-256 hashes
"""
import io
import csv
from datetime import datetime
from fastapi import APIRouter, Depends, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models import Ticket, TicketAudit
from backend.app.schemas import AnalyticsDashboardResponse
from backend.app.services.analytics import analytics_service
from backend.app.services.audit import audit_service

router = APIRouter(prefix="/analytics", tags=["Analytics & Compliance"])

@router.get("/metrics", response_model=AnalyticsDashboardResponse)
def get_analytics_metrics(db: Session = Depends(get_db)):
    """Computes real-time accuracy, confusion matrix, and resolution metrics."""
    return analytics_service.get_dashboard_metrics(db)


@router.get("/export/pdf")
def export_pdf_compliance_report(db: Session = Depends(get_db)):
    """
    Generates and downloads a branded PDF Compliance & Audit Report
    featuring executive metrics, SHA-256 provenance hashes, and immutable audit logs.
    """
    tickets = db.query(Ticket).order_by(Ticket.created_at.desc()).limit(20).all()
    audit_events = db.query(TicketAudit).order_by(TicketAudit.timestamp.desc()).limit(20).all()
    stats = analytics_service.get_dashboard_metrics(db)

    pdf_bytes = audit_service.generate_compliance_pdf(tickets, audit_events, stats)
    filename = f"BNP_SelfHealing_Compliance_Report_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/export/csv")
def export_tickets_csv(db: Session = Depends(get_db)):
    """
    Exports full ticket dataset to CSV including the SHA-256 Non-Hallucination
    cryptographic provenance hash for auditor verification.
    """
    tickets = db.query(Ticket).order_by(Ticket.created_at.desc()).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Headers
    writer.writerow([
        "Ticket_ID",
        "Department",
        "Status",
        "Match_Score_Percent",
        "Matched_Article_ID",
        "Requestor_ID_Masked",
        "Requestor_Geography",
        "Priority",
        "Created_At_UTC",
        "Resolution_Time_Mins",
        "Non_Hallucination_SHA256_Hash"
    ])

    for t in tickets:
        writer.writerow([
            t.id,
            t.department_id,
            t.status,
            f"{t.match_score:.1f}",
            t.matched_article_id or "NONE",
            audit_service.mask_pii(t.requestor_id),
            t.requestor_geography,
            t.priority,
            t.created_at.isoformat() if t.created_at else "",
            t.resolution_time_minutes,
            t.raw_sha256
        ])

    output.seek(0)
    filename = f"bnp_tickets_export_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"

    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
