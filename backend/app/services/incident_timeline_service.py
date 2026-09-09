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
    timeline_data: IncidentTimelineCreate,
):
    entry = IncidentTimeline(
        incident_id=incident_id,
        event_type=timeline_data.event_type.strip(),
        description=(
            timeline_data.description.strip()
        ),
        actor=(
            timeline_data.actor.strip()
            if timeline_data.actor
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