from sqlalchemy.orm import Session

from backend.app.models.security_event import (
    SecurityEvent,
)
from backend.app.schemas.security_event import (
    SecurityEventCreate,
)
from backend.app.services.correlation_service import (
    correlate_event,
)


def create_security_event(
    db: Session,
    event_data: SecurityEventCreate,
):
    event = SecurityEvent(
        source=event_data.source.strip(),
        event_type=event_data.event_type.strip(),
        category=(
            event_data.category.strip()
            if event_data.category
            else None
        ),
        indicator_value=(
            event_data.indicator_value
            .strip()
            .lower()
        ),
        timestamp=event_data.timestamp,
    )

    db.add(event)
    db.commit()
    db.refresh(event)

    return event


def get_security_events(
    db: Session,
):
    return (
        db.query(SecurityEvent)
        .order_by(
            SecurityEvent.timestamp.desc(),
        )
        .all()
    )


def ingest_security_event(
    db: Session,
    event_data: SecurityEventCreate,
):
    event = create_security_event(
        db,
        event_data,
    )

    alert = correlate_event(
        db,
        event,
    )

    return {
        "event": event,
        "alert": alert,
    }