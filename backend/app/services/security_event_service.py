from sqlalchemy.orm import Session

from backend.app.models.indicator import Indicator
from backend.app.models.security_event import SecurityEvent
from backend.app.schemas.security_event import SecurityEventCreate
from backend.app.services import alert_rule_service
from backend.app.services import alert_service


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

    matching_rules = (
        alert_rule_service.evaluate_rules_for_event(
            db=db,
            event=security_event,
            indicator=indicator,
        )
    )

    created_alerts = []

    if matching_rules and indicator is not None:
        for match in matching_rules:
            rule = match["rule"]

            existing_alert = (
                alert_service
                .get_open_alert_for_indicator(
                    db=db,
                    indicator_id=indicator.id,
                )
            )

            if existing_alert:
                continue

            alert = (
                await alert_service
                .create_and_broadcast_alert(
                    db=db,
                    indicator_id=indicator.id,
                    severity_score=(
                        alert_service.calculate_alert_score(
                            indicator,
                            match["event_count"],
                        )
                    ),
                    rule=rule.name,
                )
            )

            created_alerts.append(alert)

    elif indicator is not None:
        existing_alert = (
            alert_service
            .get_open_alert_for_indicator(
                db=db,
                indicator_id=indicator.id,
            )
        )

        if not existing_alert:
            alert = (
                await alert_service
                .generate_alert_for_indicator(
                    db=db,
                    indicator=indicator,
                    rule=(
                        "Internal security "
                        "event correlation"
                    ),
                )
            )

            created_alerts.append(alert)

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
            == indicator_value.strip().lower()
        )
        .order_by(
            SecurityEvent.timestamp.desc(),
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
            == indicator_value.strip().lower()
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