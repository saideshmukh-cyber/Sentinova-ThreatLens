from sqlalchemy.orm import Session

from backend.app.models.indicator import Indicator
from backend.app.models.security_event import SecurityEvent
from backend.app.models.alert import Alert
from backend.app.models.incident_timeline import IncidentTimeline
from backend.app.schemas.security_event import SecurityEventCreate
from backend.app.services import alert_rule_engine, alert_service, indicator_scoring_service, realtime_service


async def ingest_security_event(db: Session, event: SecurityEventCreate):
    normalized_value = event.indicator_value.strip().lower()
    security_event = SecurityEvent(
        source=event.source.strip(),
        event_type=event.event_type.strip(),
        category=event.category.strip() if event.category else None,
        indicator_value=normalized_value,
        timestamp=event.timestamp,
    )
    db.add(security_event)
    db.commit()
    db.refresh(security_event)

    indicator = db.query(Indicator).filter(Indicator.value == normalized_value).first()
    previous_score = int(indicator.severity_score or 0) if indicator else 0

    if indicator is not None:
        transition = indicator_scoring_service.calculate_indicator_score_transition(db, indicator)
        await realtime_service.broadcast_if_high_severity(indicator, transition["previous_score"])
        current_score = transition["score"]
    else:
        current_score = 50

    matching_rules = []
    if indicator is not None:
        matching_rules = alert_rule_engine.find_matching_rules(
            db=db, event=security_event, indicator=indicator, score=current_score
        )

    created_alerts = []
    for rule in matching_rules:
        alert = await alert_service.create_and_broadcast_alert(
            db=db,
            indicator_id=indicator.id,
            severity_score=current_score,
            rule=rule.name,
        )
        created_alerts.append(alert)

    if indicator is not None and not matching_rules:
        alert = await alert_service.generate_alert_for_indicator(
            db=db, indicator=indicator, rule="Internal security event correlation"
        )
        if alert is not None:
            created_alerts.append(alert)

    if indicator is not None and created_alerts:
        open_incident_ids = (
            db.query(Alert.incident_id)
            .filter(
                Alert.indicator_id == indicator.id,
                Alert.incident_id.isnot(None),
            )
            .all()
        )
        for (incident_id,) in open_incident_ids:
            if incident_id is None:
                continue
            db.add(IncidentTimeline(
                incident_id=incident_id,
                event_type="security_event_correlated",
                description=(
                    f"Security event {security_event.id} for indicator "
                    f"{indicator.value} was correlated with this incident."
                ),
                actor="ThreatLens",
            ))
        db.commit()

    # The API response remains the created SecurityEvent so the existing
    # response model stays compatible. Alert counts are available in logs/UI.
    return security_event


def find_events_for_indicator(db: Session, indicator_value: str):
    return (
        db.query(SecurityEvent)
        .filter(SecurityEvent.indicator_value == indicator_value.strip().lower())
        .order_by(SecurityEvent.timestamp.desc())
        .all()
    )


def count_events_for_indicator(db: Session, indicator_value: str):
    return db.query(SecurityEvent).filter(
        SecurityEvent.indicator_value == indicator_value.strip().lower()
    ).count()


def get_security_events(db: Session):
    return db.query(SecurityEvent).order_by(SecurityEvent.timestamp.desc()).all()
