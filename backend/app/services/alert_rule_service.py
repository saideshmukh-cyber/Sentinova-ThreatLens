from fastapi import HTTPException
from sqlalchemy.orm import Session

from backend.app.models.alert_rule import AlertRule
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
            AlertRule.name
            == rule_data.name.strip(),
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
        rule.description = (
            rule_data.description
        )

    if rule_data.enabled is not None:
        rule.enabled = rule_data.enabled

    if rule_data.min_score is not None:
        rule.min_score = rule_data.min_score

    if rule_data.source is not None:
        rule.source = rule_data.source.strip()

    if rule_data.category is not None:
        rule.category = (
            rule_data.category.strip()
        )

    if rule_data.threshold is not None:
        rule.threshold = rule_data.threshold

    if rule_data.window_minutes is not None:
        rule.window_minutes = (
            rule_data.window_minutes
        )

    if rule_data.route_to is not None:
        rule.route_to = (
            rule_data.route_to.strip()
        )

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