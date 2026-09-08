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
        and rule.source.lower()
        != event.source.lower()
    ):
        return False

    return True


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
        if rule_matches_event(
            rule=rule,
            event=event,
            indicator=indicator,
            score=score,
        ):
            matching_rules.append(rule)

    return matching_rules