from sqlalchemy.orm import Session

from backend.app.models.incident_timeline import (
    IncidentTimeline,
)
from backend.app.schemas.incident_timeline import (
    IncidentTimelineCreate,
)


def create_timeline_entry(
    db: Session,
    incident_id: int,
    timeline_data: IncidentTimelineCreate | None = None,
    event_type: str | None = None,
    description: str | None = None,
    actor: str | None = None,
):
    if timeline_data is not None:
        event_type = timeline_data.event_type
        description = timeline_data.description
        actor = timeline_data.actor

    if event_type is None:
        raise ValueError(
            "Timeline event type is required"
        )

    if description is None:
        raise ValueError(
            "Timeline description is required"
        )

    entry = IncidentTimeline(
        incident_id=incident_id,
        event_type=event_type.strip(),
        description=description.strip(),
        actor=(
            actor.strip()
            if actor
            else None
        ),
    )

    db.add(entry)
    db.commit()
    db.refresh(entry)

    return entry


def get_timeline_for_incident(
    db: Session,
    incident_id: int,
):
    return (
        db.query(IncidentTimeline)
        .filter(
            IncidentTimeline.incident_id
            == incident_id,
        )
        .order_by(
            IncidentTimeline.created_at.asc(),
            IncidentTimeline.id.asc(),
        )
        .all()
    )