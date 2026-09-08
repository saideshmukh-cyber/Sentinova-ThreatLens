from datetime import timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.app.models.alert_rule import AlertRule
from backend.app.models.indicator import Indicator
from backend.app.models.security_event import (
    SecurityEvent,
)


def rule_matches_event(
    rule: AlertRule,
    event: SecurityEvent,
    indicator: Indicator,
    score: int,
) -> bool:
    if not rule.enabled:
        return False

    if (
        rule.min_score is not None
        and score < rule.min_score
    ):
        return False

    if (
        rule.source is not None
        and rule.source.strip().lower()
        != event.source.strip().lower()
    ):
        return False

    if (
        rule.category is not None
        and (
            event.category is None
            or rule.category.strip().lower()
            != event.category.strip().lower()
        )
    ):
        return False

    return True


def count_matching_events(
    db: Session,
    rule: AlertRule,
    event: SecurityEvent,
) -> int:
    window_start = (
        event.timestamp
        - timedelta(
            minutes=rule.window_minutes,
        )
    )

    query = (
        db.query(SecurityEvent)
        .filter(
            SecurityEvent.indicator_value
            == event.indicator_value,
            SecurityEvent.timestamp
            >= window_start,
            SecurityEvent.timestamp
            <= event.timestamp,
        )
    )

    if rule.source is not None:
        query = query.filter(
            func.lower(
                SecurityEvent.source,
            )
            == rule.source.strip().lower()
        )

    if rule.category is not None:
        query = query.filter(
            func.lower(
                SecurityEvent.category,
            )
            == rule.category.strip().lower()
        )

    return query.count()


def threshold_reached(
    db: Session,
    rule: AlertRule,
    event: SecurityEvent,
) -> bool:
    event_count = count_matching_events(
        db=db,
        rule=rule,
        event=event,
    )

    return event_count >= rule.threshold


def find_matching_rules(
    db: Session,
    event: SecurityEvent,
    indicator: Indicator,
    score: int,
):
    rules = (
        db.query(AlertRule)
        .filter(
            AlertRule.enabled.is_(True),
        )
        .all()
    )

    matching_rules = []

    for rule in rules:
        if not rule_matches_event(
            rule=rule,
            event=event,
            indicator=indicator,
            score=score,
        ):
            continue

        if not threshold_reached(
            db=db,
            rule=rule,
            event=event,
        ):
            continue

        matching_rules.append(rule)

    return matching_rules