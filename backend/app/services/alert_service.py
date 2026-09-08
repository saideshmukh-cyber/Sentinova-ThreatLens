from fastapi import HTTPException
from sqlalchemy.orm import Session

from backend.app.models.alert import (
    Alert,
    AlertStatus,
)
from backend.app.models.indicator import (
    Indicator,
)
from backend.app.schemas.alert import (
    AlertUpdate,
)


OPEN_ALERT_STATUSES = [
    AlertStatus.NEW,
    AlertStatus.ACKNOWLEDGED,
    AlertStatus.IN_PROGRESS,
]


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
        status=AlertStatus.NEW,
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
            Alert.severity_score.desc(),
            Alert.created_at.desc(),
        )
        .all()
    )


def get_alert(
    db: Session,
    alert_id: int,
):
    return (
        db.query(Alert)
        .filter(
            Alert.id == alert_id,
        )
        .first()
    )


def get_open_alert_for_rule(
    db: Session,
    indicator_id: int,
    rule: str,
):
    return (
        db.query(Alert)
        .filter(
            Alert.indicator_id
            == indicator_id,
            Alert.rule == rule,
            Alert.status.in_(
                OPEN_ALERT_STATUSES,
            ),
        )
        .order_by(
            Alert.created_at.desc(),
        )
        .first()
    )


def update_alert(
    db: Session,
    alert_id: int,
    alert_data: AlertUpdate,
):
    alert = get_alert(
        db,
        alert_id,
    )

    if alert is None:
        raise HTTPException(
            status_code=404,
            detail="Alert not found",
        )

    if alert_data.status is not None:
        alert.status = alert_data.status

    if alert_data.assignee is not None:
        alert.assignee = (
            alert_data.assignee.strip()
        )

    db.commit()
    db.refresh(alert)

    return alert


def generate_alert_for_indicator(
    db: Session,
    indicator: Indicator,
    rule: str,
):
    existing_alert = (
        get_open_alert_for_rule(
            db=db,
            indicator_id=indicator.id,
            rule=rule,
        )
    )

    if existing_alert is not None:
        return None

    return create_alert(
        db=db,
        indicator_id=indicator.id,
        severity_score=calculate_alert_score(
            indicator
        ),
        rule=rule,
    )


def calculate_alert_score(
    indicator: Indicator,
) -> int:
    return 50