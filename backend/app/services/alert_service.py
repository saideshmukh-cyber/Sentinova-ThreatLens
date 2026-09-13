from sqlalchemy.orm import Session

from backend.app.models.alert import Alert
from backend.app.models.incident import Incident
from backend.app.models.incident import IncidentSeverity
from backend.app.models.incident import IncidentStatus
from backend.app.services import incident_service


def calculate_alert_score(
    indicator,
    internal_sightings: int = 0,
):
    if indicator is not None:
        return min(
            max(
                int(
                    getattr(
                        indicator,
                        "severity_score",
                        0,
                    )
                    or 0
                ),
                0,
            ),
            100,
        )

    score = 50

    score += min(
        internal_sightings * 10,
        50,
    )

    return min(
        score,
        100,
    )

def create_alert(
    db: Session,
    indicator_id: int,
    severity_score: int,
    rule: str,
):
    alert = Alert(
        indicator_id=indicator_id,
        severity_score=severity_score,
        rule=rule,
    )

    db.add(alert)
    db.commit()
    db.refresh(alert)

    return alert


def get_alerts(
    db: Session,
):
    return (
        db.query(Alert)
        .order_by(
            Alert.created_at.desc(),
        )
        .all()
    )


def get_open_alert_for_indicator(
    db: Session,
    indicator_id: int,
):
    return (
        db.query(Alert)
        .filter(
            Alert.indicator_id == indicator_id,
            Alert.status.notin_(
                [
                    "resolved",
                    "closed",
                ]
            ),
        )
        .order_by(
            Alert.created_at.desc(),
        )
        .first()
    )


def get_or_create_incident_for_alert(
    db: Session,
    alert: Alert,
):
    existing_incident = (
        db.query(Incident)
        .join(
            Alert,
            Alert.incident_id == Incident.id,
        )
        .filter(
            Alert.indicator_id
            == alert.indicator_id,
            Incident.status.in_(
                [
                    IncidentStatus.OPEN,
                    IncidentStatus.IN_PROGRESS,
                ]
            ),
        )
        .first()
    )

    if existing_incident:
        return existing_incident

    if alert.severity_score >= 80:
        severity = IncidentSeverity.CRITICAL
    elif alert.severity_score >= 60:
        severity = IncidentSeverity.HIGH
    elif alert.severity_score >= 30:
        severity = IncidentSeverity.MEDIUM
    else:
        severity = IncidentSeverity.LOW

    incident = Incident(
        title=f"ThreatLens Incident - Alert {alert.id}",
        description=(
            f"Automatically created from alert {alert.id}."
        ),
        severity=severity,
        status=IncidentStatus.OPEN,
        assignee=None,
    )

    db.add(incident)
    db.commit()
    db.refresh(incident)

    incident_service.incident_timeline_service.create_timeline_entry(
        db=db,
        incident_id=incident.id,
        event_type="alert_created",
        description=(
            f"Alert {alert.id} automatically created "
            f"incident {incident.id}."
        ),
        actor="ThreatLens",
    )

    return incident


async def create_and_broadcast_alert(
    db: Session,
    indicator_id: int,
    severity_score: int,
    rule: str,
):
    existing = get_open_alert_for_indicator(
        db,
        indicator_id,
    )

    if existing:
        return existing

    alert = create_alert(
        db=db,
        indicator_id=indicator_id,
        severity_score=severity_score,
        rule=rule,
    )

    incident = get_or_create_incident_for_alert(
        db=db,
        alert=alert,
    )

    alert.incident_id = incident.id

    db.commit()
    db.refresh(alert)

    await broadcast_alert(
        event="alert.created",
        alert=alert,
    )

    return alert


def alert_to_message(
    event: str,
    alert: Alert,
):
    return {
        "event": event,
        "data": {
            "alert": {
                "id": alert.id,
                "indicator_id": alert.indicator_id,
                "incident_id": alert.incident_id,
                "severity_score": alert.severity_score,
                "rule": alert.rule,
                "status": alert.status.value,
                "assignee": alert.assignee,
                "created_at": (
                    alert.created_at.isoformat()
                    if alert.created_at
                    else None
                ),
                "updated_at": (
                    alert.updated_at.isoformat()
                    if alert.updated_at
                    else None
                ),
            }
        },
    }


async def broadcast_alert(
    event: str,
    alert: Alert,
):
    from backend.app.websocket.manager import manager

    await manager.broadcast(
        alert_to_message(
            event=event,
            alert=alert,
        )
    )


async def update_alert(
    db: Session,
    alert_id: int,
    alert_data,
):
    alert = (
        db.query(Alert)
        .filter(
            Alert.id == alert_id,
        )
        .first()
    )

    if alert is None:
        from fastapi import HTTPException

        raise HTTPException(
            status_code=404,
            detail="Alert not found",
        )

    old_status = alert.status
    old_assignee = alert.assignee

    if alert_data.status is not None:
        alert.status = alert_data.status

    if alert_data.assignee is not None:
        alert.assignee = alert_data.assignee

    db.commit()
    db.refresh(alert)

    if old_status != alert.status:
        incident = None

        if alert.incident_id:
            incident = (
                db.query(Incident)
                .filter(
                    Incident.id
                    == alert.incident_id,
                )
                .first()
            )

        if incident:
            incident_service.incident_timeline_service.create_timeline_entry(
                db=db,
                incident_id=incident.id,
                event_type="alert_status_change",
                description=(
                    f"Alert {alert.id} status changed from "
                    f"{old_status.value} to "
                    f"{alert.status.value}."
                ),
                actor=alert.assignee or "ThreatLens",
            )

    if old_assignee != alert.assignee:
        if alert.incident_id:
            incident_service.incident_timeline_service.create_timeline_entry(
                db=db,
                incident_id=alert.incident_id,
                event_type="alert_assignment_change",
                description=(
                    f"Alert {alert.id} assignee changed from "
                    f"{old_assignee or 'Unassigned'} to "
                    f"{alert.assignee or 'Unassigned'}."
                ),
                actor=alert.assignee or "ThreatLens",
            )

    await broadcast_alert(
        event="alert.updated",
        alert=alert,
    )

    return alert


async def generate_alert_for_indicator(
    db: Session,
    indicator,
    rule: str,
):
    existing = get_open_alert_for_indicator(
        db,
        indicator.id,
    )

    if existing:
        return existing

    return await create_and_broadcast_alert(
        db=db,
        indicator_id=indicator.id,
        severity_score=calculate_alert_score(
            indicator,
        ),
        rule=rule,
    )


async def attach_alert_to_incident(
    db: Session,
    alert_id: int,
    incident_id: int,
):
    from fastapi import HTTPException
    from backend.app.models.incident_timeline import IncidentTimeline

    alert = (
        db.query(Alert)
        .filter(
            Alert.id == alert_id,
        )
        .first()
    )

    if alert is None:
        raise HTTPException(
            status_code=404,
            detail="Alert not found",
        )

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

    alert.incident_id = incident.id

    db.commit()
    db.refresh(alert)

    timeline = IncidentTimeline(
        incident_id=incident.id,
        event_type="alert_attached",
        description=(
            f"Alert {alert.id} was attached "
            f"to incident {incident.id}."
        ),
        actor="ThreatLens",
    )

    db.add(timeline)
    db.commit()

    await broadcast_alert(
        event="alert.updated",
        alert=alert,
    )

    return alert