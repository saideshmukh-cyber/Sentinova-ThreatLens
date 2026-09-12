from datetime import datetime, timedelta

from fastapi import HTTPException
from sqlalchemy.orm import Session

from backend.app.models.alert_rule import AlertRule
from backend.app.models.security_event import SecurityEvent
from backend.app.schemas.alert_rule import (
    AlertRuleCreate,
    AlertRuleUpdate,
)


def create_alert_rule(
    db: Session,
    rule_data: AlertRuleCreate,
):
    existing = (
        db.query(AlertRule)
        .filter(
            AlertRule.name == rule_data.name.strip(),
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=409,
            detail="Alert rule already exists",
        )

    rule = AlertRule(
        name=rule_data.name.strip(),
        description=rule_data.description,
        enabled=rule_data.enabled,
        min_score=rule_data.min_score,
        source=(
            rule_data.source.strip()
            if rule_data.source
            else None
        ),
        category=(
            rule_data.category.strip()
            if rule_data.category
            else None
        ),
        threshold=rule_data.threshold,
        window_minutes=rule_data.window_minutes,
        route_to=(
            rule_data.route_to.strip()
            if rule_data.route_to
            else None
        ),
    )

    db.add(rule)
    db.commit()
    db.refresh(rule)

    return rule


def get_alert_rules(
    db: Session,
):
    return (
        db.query(AlertRule)
        .order_by(
            AlertRule.created_at.desc(),
        )
        .all()
    )


def get_alert_rule(
    db: Session,
    rule_id: int,
):
    rule = (
        db.query(AlertRule)
        .filter(
            AlertRule.id == rule_id,
        )
        .first()
    )

    if rule is None:
        raise HTTPException(
            status_code=404,
            detail="Alert rule not found",
        )

    return rule


def update_alert_rule(
    db: Session,
    rule_id: int,
    rule_data: AlertRuleUpdate,
):
    rule = get_alert_rule(
        db,
        rule_id,
    )

    if rule_data.name is not None:
        rule.name = rule_data.name.strip()

    if rule_data.description is not None:
        rule.description = rule_data.description

    if rule_data.enabled is not None:
        rule.enabled = rule_data.enabled

    if rule_data.min_score is not None:
        rule.min_score = rule_data.min_score

    if rule_data.source is not None:
        rule.source = rule_data.source.strip()

    if rule_data.category is not None:
        rule.category = rule_data.category.strip()

    if rule_data.threshold is not None:
        rule.threshold = rule_data.threshold

    if rule_data.window_minutes is not None:
        rule.window_minutes = rule_data.window_minutes

    if rule_data.route_to is not None:
        rule.route_to = rule_data.route_to.strip()

    db.commit()
    db.refresh(rule)

    return rule


def delete_alert_rule(
    db: Session,
    rule_id: int,
):
    rule = get_alert_rule(
        db,
        rule_id,
    )

    db.delete(rule)
    db.commit()

    return rule


def rule_matches_event(
    rule: AlertRule,
    event: SecurityEvent,
    indicator=None,
):
    if not rule.enabled:
        return False

    if (
        rule.source
        and event.source.strip().lower()
        != rule.source.strip().lower()
    ):
        return False

    if (
        rule.category
        and (
            not event.category
            or event.category.strip().lower()
            != rule.category.strip().lower()
        )
    ):
        return False

    if (
        rule.min_score is not None
        and indicator is not None
        and getattr(
            indicator,
            "severity_score",
            50,
        ) < rule.min_score
    ):
        return False

    return True


def count_matching_events(
    db: Session,
    rule: AlertRule,
    indicator_value: str,
    event: SecurityEvent,
):
    if rule.window_minutes <= 0:
        return 1

    event_time = event.timestamp

    window_start = (
        event_time
        - timedelta(
            minutes=rule.window_minutes
        )
    )

    query = (
        db.query(SecurityEvent)
        .filter(
            SecurityEvent.indicator_value
            == indicator_value.strip().lower(),
            SecurityEvent.timestamp
            >= window_start,
            SecurityEvent.timestamp
            <= event_time,
        )
    )

    if rule.source:
        query = query.filter(
            SecurityEvent.source.ilike(
                rule.source.strip()
            )
        )

    if rule.category:
        query = query.filter(
            SecurityEvent.category.ilike(
                rule.category.strip()
            )
        )

    return query.count()


def evaluate_rules_for_event(
    db: Session,
    event: SecurityEvent,
    indicator=None,
):
    rules = (
        db.query(AlertRule)
        .filter(
            AlertRule.enabled.is_(True),
        )
        .all()
    )

    matches = []

    for rule in rules:
        if not rule_matches_event(
            rule,
            event,
            indicator,
        ):
            continue

        event_count = count_matching_events(
            db=db,
            rule=rule,
            indicator_value=event.indicator_value,
            event=event,
        )

        if event_count >= rule.threshold:
            matches.append(
                {
                    "rule": rule,
                    "event_count": event_count,
                }
            )

    return matches