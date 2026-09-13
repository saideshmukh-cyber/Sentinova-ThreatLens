from sqlalchemy.orm import Session

from backend.app.models.incident import Incident
from backend.app.models.incident_timeline import IncidentTimeline
from backend.app.models.indicator import Indicator
from backend.app.models.security_event import SecurityEvent


def find_incidents_for_indicator(
    db: Session,
    indicator: Indicator,
):
    incidents = (
        db.query(Incident)
        .join(
            IncidentTimeline,
            IncidentTimeline.incident_id
            == Incident.id,
        )
        .filter(
            IncidentTimeline.description.ilike(
                f"%{indicator.value}%"
            )
        )
        .distinct()
        .all()
    )

    return incidents


def find_incidents_for_security_event(
    db: Session,
    event: SecurityEvent,
):
    incidents = (
        db.query(Incident)
        .join(
            IncidentTimeline,
            IncidentTimeline.incident_id
            == Incident.id,
        )
        .filter(
            IncidentTimeline.description.ilike(
                f"%{event.indicator_value}%"
            )
        )
        .distinct()
        .all()
    )

    return incidents


def add_indicator_to_incident_timeline(
    db: Session,
    incident_id: int,
    indicator: Indicator,
):
    timeline_entry = IncidentTimeline(
        incident_id=incident_id,
        event_type="indicator_correlated",
        description=(
            f"Indicator correlated: "
            f"{indicator.indicator_type.value} "
            f"{indicator.value} "
            f"(severity score "
            f"{indicator.severity_score})"
        ),
        actor="ThreatLens",
    )

    db.add(timeline_entry)
    db.commit()
    db.refresh(timeline_entry)

    return timeline_entry


def add_security_event_to_incident_timeline(
    db: Session,
    incident_id: int,
    event: SecurityEvent,
):
    timeline_entry = IncidentTimeline(
        incident_id=incident_id,
        event_type="security_event_correlated",
        description=(
            f"Security event correlated: "
            f"{event.event_type} from "
            f"{event.source} for indicator "
            f"{event.indicator_value}"
        ),
        actor="ThreatLens",
    )

    db.add(timeline_entry)
    db.commit()
    db.refresh(timeline_entry)

    return timeline_entry


def correlate_indicator_with_incidents(
    db: Session,
    indicator: Indicator,
):
    incidents = find_incidents_for_indicator(
        db=db,
        indicator=indicator,
    )

    created = []

    for incident in incidents:
        timeline_entry = (
            add_indicator_to_incident_timeline(
                db=db,
                incident_id=incident.id,
                indicator=indicator,
            )
        )

        created.append(timeline_entry)

    return created


def correlate_security_event_with_incidents(
    db: Session,
    event: SecurityEvent,
):
    incidents = find_incidents_for_security_event(
        db=db,
        event=event,
    )

    created = []

    for incident in incidents:
        timeline_entry = (
            add_security_event_to_incident_timeline(
                db=db,
                incident_id=incident.id,
                event=event,
            )
        )

        created.append(timeline_entry)

    return created