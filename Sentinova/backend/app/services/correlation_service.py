from sqlalchemy.orm import Session

from backend.app.models.indicator import Indicator
from backend.app.models.security_event import (
    SecurityEvent,
)
from backend.app.services.alert_rule_engine import (
    find_matching_rules,
)
from backend.app.services.alert_service import (
    generate_alert_for_indicator,
)


def find_matching_indicator(
    db: Session,
    event: SecurityEvent,
):
    return (
        db.query(Indicator)
        .filter(
            Indicator.value
            == event.indicator_value
        )
        .first()
    )


async def correlate_event(
    db: Session,
    event: SecurityEvent,
):
    indicator = find_matching_indicator(
        db,
        event,
    )

    if indicator is None:
        return None

    score = 50

    matching_rules = find_matching_rules(
        db=db,
        event=event,
        indicator=indicator,
        score=score,
    )

    if not matching_rules:
        return None

    alerts = []

    for rule in matching_rules:
        alert = await generate_alert_for_indicator(
            db=db,
            indicator=indicator,
            rule=rule.name,
        )

        if alert is None:
            continue

        if rule.route_to:
            alert.assignee = (
                rule.route_to
            )

            db.commit()
            db.refresh(alert)

        alerts.append(alert)

    return alerts or None