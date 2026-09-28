from sqlalchemy.orm import Session

from backend.app.models.audit_log import AuditLog


def record_audit(
    db: Session,
    *,
    actor: str,
    action: str,
    entity_type: str,
    entity_id: str | None,
    details: dict | None = None,
    correlation_id: str | None = None,
):
    record = AuditLog(
        actor=actor,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details or {},
        correlation_id=correlation_id,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record
