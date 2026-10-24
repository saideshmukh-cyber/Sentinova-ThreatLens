
from fastapi import HTTPException
from sqlalchemy.orm import Session

from backend.app.models.alert import Alert
from backend.app.models.incident import Incident
from backend.app.models.incident_timeline import IncidentTimeline
from backend.app.schemas.incident import IncidentCreate, IncidentUpdate
from backend.app.services import incident_timeline_service


def create_incident(db: Session, incident_data: IncidentCreate):
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
        description=f"Incident {incident.id} was created.",
        actor=incident.assignee or "ThreatLens",
    )

    return incident


def get_incidents(db: Session):
    return db.query(Incident).order_by(Incident.created_at.desc()).all()


def get_incident(db: Session, incident_id: int):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()

    if incident is None:
        raise HTTPException(status_code=404, detail="Incident not found")

    return incident


def update_incident(
    db: Session,
    incident_id: int,
    incident_data: IncidentUpdate,
):
    incident = get_incident(db, incident_id)

    old_status = incident.status
    old_assignee = incident.assignee
    old_severity = incident.severity

    if incident_data.title is not None:
        incident.title = incident_data.title.strip()

    if incident_data.description is not None:
        incident.description = incident_data.description.strip()

    if incident_data.severity is not None:
        incident.severity = incident_data.severity

    if incident_data.status is not None:
        incident.status = incident_data.status

    if incident_data.assignee is not None:
        incident.assignee = incident_data.assignee.strip() or None

    db.commit()
    db.refresh(incident)

    if old_status != incident.status:
        incident_timeline_service.create_timeline_entry(
            db=db,
            incident_id=incident.id,
            event_type="status_change",
            description=(
                f"Incident status changed from "
                f"{old_status.value} to {incident.status.value}."
            ),
            actor=incident.assignee or "ThreatLens",
        )

    if old_assignee != incident.assignee:
        incident_timeline_service.create_timeline_entry(
            db=db,
            incident_id=incident.id,
            event_type="assignment_change",
            description=(
                f"Incident assignee changed from "
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
                f"Incident severity changed from "
                f"{old_severity.value} to {incident.severity.value}."
            ),
            actor=incident.assignee or "ThreatLens",
        )

    return incident


def delete_incident(db: Session, incident_id: int):
    incident = get_incident(db, incident_id)

    # Alerts and timeline rows reference incidents. Remove those references
    # before deleting the parent so PostgreSQL cannot reject the delete.
    db.query(Alert).filter(Alert.incident_id == incident_id).update(
        {Alert.incident_id: None},
        synchronize_session=False,
    )

    db.query(IncidentTimeline).filter(
        IncidentTimeline.incident_id == incident_id
    ).delete(synchronize_session=False)

    db.delete(incident)
    db.commit()

    return incident
