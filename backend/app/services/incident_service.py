from fastapi import HTTPException
from sqlalchemy.orm import Session

from backend.app.models.incident import (
    Incident,
)
from backend.app.schemas.incident import (
    IncidentCreate,
    IncidentUpdate,
)
from backend.app.services import (
    incident_timeline_service,
)


def create_incident(
    db: Session,
    incident_data: IncidentCreate,
):
    incident = Incident(
        title=incident_data.title.strip(),
        description=(
            incident_data.description.strip()
            if incident_data.description
            else None
        ),
        severity=incident_data.severity,
        assignee=(
            incident_data.assignee.strip()
            if incident_data.assignee
            else None
        ),
    )

    db.add(incident)
    db.commit()
    db.refresh(incident)

    incident_timeline_service.create_timeline_entry(
        db=db,
        incident_id=incident.id,
        event_type="incident_created",
        description=(
            f"Incident {incident.id} was created."
        ),
        actor=incident.assignee or "ThreatLens",
    )

    return incident


def get_incidents(
    db: Session,
):
    return (
        db.query(Incident)
        .order_by(
            Incident.created_at.desc(),
        )
        .all()
    )


def get_incident(
    db: Session,
    incident_id: int,
):
    incident = (
        db.query(Incident)
        .filter(
            Incident.id == incident_id,
        )
        .first()
    )

    if incident is None:
        raise HTTPException(
            status_code=404,
            detail="Incident not found",
        )

    return incident


def update_incident(
    db: Session,
    incident_id: int,
    incident_data: IncidentUpdate,
):
    incident = get_incident(
        db,
        incident_id,
    )

    old_status = incident.status
    old_assignee = incident.assignee
    old_severity = incident.severity

    if incident_data.title is not None:
        incident.title = (
            incident_data.title.strip()
        )

    if incident_data.description is not None:
        incident.description = (
            incident_data.description.strip()
        )

    if incident_data.severity is not None:
        incident.severity = (
            incident_data.severity
        )

    if incident_data.status is not None:
        incident.status = (
            incident_data.status
        )

    if incident_data.assignee is not None:
        incident.assignee = (
            incident_data.assignee.strip()
        )

    db.commit()
    db.refresh(incident)

    if old_status != incident.status:
        incident_timeline_service.create_timeline_entry(
            db=db,
            incident_id=incident.id,
            event_type="status_change",
            description=(
                "Incident status changed from "
                f"{old_status.value} to "
                f"{incident.status.value}."
            ),
            actor=incident.assignee or "ThreatLens",
        )

    if old_assignee != incident.assignee:
        incident_timeline_service.create_timeline_entry(
            db=db,
            incident_id=incident.id,
            event_type="assignment_change",
            description=(
                "Incident assignee changed from "
                f"{old_assignee or 'Unassigned'} to "
                f"{incident.assignee or 'Unassigned'}."
            ),
            actor=incident.assignee or "ThreatLens",
        )

    if old_severity != incident.severity:
        incident_timeline_service.create_timeline_entry(
            db=db,
            incident_id=incident.id,
            event_type="severity_change",
            description=(
                "Incident severity changed from "
                f"{old_severity.value} to "
                f"{incident.severity.value}."
            ),
            actor=incident.assignee or "ThreatLens",
        )

    return incident


def delete_incident(
    db: Session,
    incident_id: int,
):
    incident = get_incident(
        db,
        incident_id,
    )

    db.delete(incident)
    db.commit()

    return incident