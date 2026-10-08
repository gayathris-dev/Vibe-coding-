"""
Health Check and System Diagnostics Endpoint.
"""
from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from backend.app.database import get_db
from backend.app.config import settings

router = APIRouter(tags=["Health & Status"])

@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    """Production health-check endpoint (Spec Task VII & Production)."""
    db_status = "healthy"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    return {
        "status": "UP" if "unhealthy" not in db_status else "DOWN",
        "service": settings.PROJECT_NAME,
        "version": settings.PROJECT_VERSION,
        "timestamp": datetime.utcnow().isoformat(),
        "database": db_status,
        "ai_engine": "Sentence-Transformers & Scikit-Learn (Open Source)"
    }
