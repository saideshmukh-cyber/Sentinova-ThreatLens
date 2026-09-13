from sqlalchemy.orm import Session

from backend.app.models.indicator import Indicator
from backend.app.models.security_event import SecurityEvent
from backend.app.schemas.security_event import SecurityEventCreate
from backend.app.services import alert_rule_service
from backend.app.services import alert_service
from backend.app.services import indicator_scoring_service
from backend.app.services import realtime_service


async def ingest_security_event(
    db: Session,
    event: SecurityEventCreate,
):
    security_event = SecurityEvent(
        source=event.source.strip(),
        event_type=event.event_type.strip(),
        category=(
            event.category.strip()
            if event.category
            else None
        ),
        indicator_value=event.indicator_value.strip().lower(),
        timestamp=event.timestamp,
    )

    db.add(security_event)
    db.commit()
    db.refresh(security_event)

    indicator = (
        db.query(Indicator)
        .filter(
            Indicator.value
            == security_event.indicator_value
        )
        .first()
    )

    if indicator is not None:
        transition = (
            indicator_scoring_service
            .calculate_indicator_score_transition(
                db=db,
                indicator=indicator,
            )
        )

        await realtime_service.broadcast_if_high_severity(
            indicator=indicator,
            previous_score=transition[
                "previous_score"
            ],
        )

    matching_rules = (
        alert_rule_service.evaluate_rules_for_event(
            db=db,
            event=security_event,
            indicator=indicator,
        )
    )

    created_alerts = []

    if matching_rules:
        for match in matching_rules:
            rule = match["rule"]

            severity_score = (
                indicator.severity_score
                if indicator is not None
                else 50
            )

            alert = (
                await alert_service
                .create_and_broadcast_alert(
                    db=db,
                    indicator_id=(
                        indicator.id
                        if indicator
                        else 0
                    ),
                    severity_score=severity_score,
                    rule=rule.name,
                )
            )

            created_alerts.append(alert)

    elif indicator is not None:
        await alert_service.generate_alert_for_indicator(
            db=db,
            indicator=indicator,
            rule="Internal security event correlation",
        )

    return {
        "event": security_event,
        "alerts_created": len(
            created_alerts
        ),
    }


def find_events_for_indicator(
    db: Session,
    indicator_value: str,
):
    return (
        db.query(SecurityEvent)
        .filter(
            SecurityEvent.indicator_value
            == indicator_value
        )
        .order_by(
            SecurityEvent.timestamp.desc()
        )
        .all()
    )


def count_events_for_indicator(
    db: Session,
    indicator_value: str,
):
    return (
        db.query(SecurityEvent)
        .filter(
            SecurityEvent.indicator_value
            == indicator_value
        )
        .count()
    )


def get_security_events(
    db: Session,
):
    return (
        db.query(SecurityEvent)
        .order_by(
            SecurityEvent.timestamp.desc()
        )
        .all()
    )