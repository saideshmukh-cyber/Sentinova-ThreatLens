from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.app.db.database import SessionLocal
from backend.app.models.audit_log import AuditLog

router = APIRouter(prefix="/api/v1/audit", tags=["Audit"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/")
def get_audit_logs(limit: int = Query(100, ge=1, le=500), db: Session = Depends(get_db)):
    rows = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit).all()
    return [
        {
            "id": row.id,
            "actor": row.actor,
            "action": row.action,
            "entity_type": row.entity_type,
            "entity_id": row.entity_id,
            "details": row.details,
            "correlation_id": row.correlation_id,
            "timestamp": row.timestamp.isoformat(),
        }
        for row in rows
    ]
