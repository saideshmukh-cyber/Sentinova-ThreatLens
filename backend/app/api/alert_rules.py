from fastapi import (
    APIRouter,
    Depends,
)
from sqlalchemy.orm import Session

from backend.app.db.database import SessionLocal
from backend.app.schemas.alert_rule import (
    AlertRuleCreate,
    AlertRuleResponse,
    AlertRuleUpdate,
)
from backend.app.services import (
    alert_rule_service,
)


router = APIRouter(
    prefix="/api/v1/alert-rules",
    tags=["Alert Rules"],
)


def get_db():
    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


@router.post(
    "/",
    response_model=AlertRuleResponse,
    status_code=201,
)
def create_alert_rule(
    rule: AlertRuleCreate,
    db: Session = Depends(get_db),
):
    return (
        alert_rule_service
        .create_alert_rule(
            db,
            rule,
        )
    )


@router.get(
    "/",
    response_model=list[AlertRuleResponse],
)
def get_alert_rules(
    db: Session = Depends(get_db),
):
    return (
        alert_rule_service
        .get_alert_rules(db)
    )


@router.get(
    "/{rule_id}",
    response_model=AlertRuleResponse,
)
def get_alert_rule(
    rule_id: int,
    db: Session = Depends(get_db),
):
    return (
        alert_rule_service
        .get_alert_rule(
            db,
            rule_id,
        )
    )


@router.put(
    "/{rule_id}",
    response_model=AlertRuleResponse,
)
def update_alert_rule(
    rule_id: int,
    rule: AlertRuleUpdate,
    db: Session = Depends(get_db),
):
    return (
        alert_rule_service
        .update_alert_rule(
            db,
            rule_id,
            rule,
        )
    )


@router.delete(
    "/{rule_id}",
    response_model=AlertRuleResponse,
)
def delete_alert_rule(
    rule_id: int,
    db: Session = Depends(get_db),
):
    return (
        alert_rule_service
        .delete_alert_rule(
            db,
            rule_id,
        )
    )