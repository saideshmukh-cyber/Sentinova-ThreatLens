from fastapi import HTTPException
from sqlalchemy.orm import Session

from backend.app.models.alert import Alert
from backend.app.models.incident import Incident, IncidentSeverity, IncidentStatus
from backend.app.services import incident_service
from backend.app.schemas.incident import IncidentCreate


def calculate_alert_score(indicator, internal_sightings: int = 0):
    if indicator is not None:
        return min(max(int(getattr(indicator, "severity_score", 0) or 0), 0), 100)
    return min(50 + min(internal_sightings * 10, 50), 100)


def create_alert(db: Session, indicator_id: int, severity_score: int, rule: str):
    alert = Alert(indicator_id=indicator_id, severity_score=severity_score, rule=rule)
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert


def get_alerts(db: Session):
    return db.query(Alert).order_by(Alert.created_at.desc()).all()


def get_open_alert_for_indicator(db: Session, indicator_id: int):
    return (
        db.query(Alert)
        .filter(Alert.indicator_id == indicator_id, Alert.status.notin_(["resolved", "closed"]))
        .order_by(Alert.created_at.desc())
        .first()
    )


async def create_and_broadcast_alert(db: Session, indicator_id: int, severity_score: int, rule: str):
    existing = get_open_alert_for_indicator(db, indicator_id)
    if existing:
        return existing

    # Incidents are created explicitly from the Alerts workflow rather than automatically.
    alert = create_alert(db, indicator_id, severity_score, rule)
    await broadcast_alert("alert.created", alert)
    return alert


def alert_to_message(event: str, alert: Alert):
    return {
        "event": event,
        "data": {"alert": {
            "id": alert.id,
            "indicator_id": alert.indicator_id,
            "incident_id": alert.incident_id,
            "severity_score": alert.severity_score,
            "rule": alert.rule,
            "status": alert.status.value,
            "assignee": alert.assignee,
            "created_at": alert.created_at.isoformat() if alert.created_at else None,
            "updated_at": alert.updated_at.isoformat() if alert.updated_at else None,
        }},
    }


async def broadcast_alert(event: str, alert: Alert):
    from backend.app.services.realtime_bus import publish_event
    message = alert_to_message(event, alert)
    message["channel"] = "alerts.stream"
    await publish_event(message)


async def update_alert(db: Session, alert_id: int, alert_data):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if alert is None:
        raise HTTPException(status_code=404, detail="Alert not found")

    old_status = alert.status
    old_assignee = alert.assignee

    if alert_data.status is not None:
        alert.status = alert_data.status
    if alert_data.assignee is not None:
        alert.assignee = alert_data.assignee

    db.commit()
    db.refresh(alert)

    if old_status != alert.status and alert.incident_id:
        incident_service.incident_timeline_service.create_timeline_entry(
            db=db,
            incident_id=alert.incident_id,
            event_type="alert_status_change",
            description=f"Alert {alert.id} status changed from {old_status.value} to {alert.status.value}.",
            actor=alert.assignee or "ThreatLens",
        )

    if old_assignee != alert.assignee and alert.incident_id:
        incident_service.incident_timeline_service.create_timeline_entry(
            db=db,
            incident_id=alert.incident_id,
            event_type="alert_assignment_change",
            description=f"Alert {alert.id} assignee changed from {old_assignee or 'Unassigned'} to {alert.assignee or 'Unassigned'}.",
            actor=alert.assignee or "ThreatLens",
        )

    await broadcast_alert("alert.updated", alert)
    return alert


async def escalate_alert(db: Session, alert_id: int):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if alert is None:
        raise HTTPException(status_code=404, detail="Alert not found")
    if alert.status.value in {"resolved", "closed"}:
        raise HTTPException(status_code=409, detail="Resolved or closed alerts cannot be escalated.")

    old_status = alert.status
    alert.status = "in-progress"
    db.commit()
    db.refresh(alert)

    if alert.incident_id:
        incident_service.incident_timeline_service.create_timeline_entry(
            db=db,
            incident_id=alert.incident_id,
            event_type="alert_escalated",
            description=f"Alert {alert.id} was escalated from {old_status.value} to in-progress.",
            actor=alert.assignee or "ThreatLens",
        )

    await broadcast_alert("alert.updated", alert)
    return alert


async def create_incident_from_alert(db: Session, alert_id: int, incident_data: IncidentCreate):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if alert is None:
        raise HTTPException(status_code=404, detail="Alert not found")
    if alert.incident_id is not None:
        raise HTTPException(status_code=409, detail=f"Alert is already attached to incident {alert.incident_id}.")

    incident = Incident(
        title=incident_data.title.strip(),
        description=incident_data.description.strip() if incident_data.description else f"Incident created from alert {alert.id}.",
        severity=incident_data.severity,
        status=IncidentStatus.OPEN,
        assignee=incident_data.assignee.strip() if incident_data.assignee else alert.assignee,
    )
    db.add(incident)
    db.flush()
    alert.incident_id = incident.id
    db.commit()
    db.refresh(incident)
    db.refresh(alert)

    incident_service.incident_timeline_service.create_timeline_entry(
        db=db,
        incident_id=incident.id,
        event_type="incident_created_from_alert",
        description=f"Incident {incident.id} was created from alert {alert.id}.",
        actor=alert.assignee or "ThreatLens",
    )
    await broadcast_alert("alert.updated", alert)
    return incident


async def generate_alert_for_indicator(db: Session, indicator, rule: str):
    existing = get_open_alert_for_indicator(db, indicator.id)
    if existing:
        return existing
    return await create_and_broadcast_alert(
        db=db, indicator_id=indicator.id,
        severity_score=calculate_alert_score(indicator), rule=rule,
    )


async def attach_alert_to_incident(db: Session, alert_id: int, incident_id: int):
    from backend.app.models.incident_timeline import IncidentTimeline

    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if alert is None:
        raise HTTPException(status_code=404, detail="Alert not found")

    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if incident is None:
        raise HTTPException(status_code=404, detail="Incident not found")

    if incident.status in {IncidentStatus.RESOLVED, IncidentStatus.CLOSED}:
        raise HTTPException(status_code=409, detail="Alerts cannot be attached to a resolved or closed incident.")

    alert.incident_id = incident.id
    db.commit()
    db.refresh(alert)

    db.add(IncidentTimeline(
        incident_id=incident.id,
        event_type="alert_attached",
        description=f"Alert {alert.id} was attached to incident {incident.id}.",
        actor=alert.assignee or "ThreatLens",
    ))
    db.commit()

    await broadcast_alert("alert.updated", alert)
    return alert
