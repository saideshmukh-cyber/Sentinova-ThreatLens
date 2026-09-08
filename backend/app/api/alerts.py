from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.db.database import SessionLocal
from backend.app.schemas.alert import AlertResponse, AlertUpdate
from backend.app.services import alert_service


router = APIRouter(
    prefix="/api/v1/alerts",
    tags=["Alerts"],
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


@router.get("/", response_model=list[AlertResponse])
def get_alerts(
    db: Session = Depends(get_db),
):
    return alert_service.get_alerts(db)


@router.patch(
    "/{alert_id}",
    response_model=AlertResponse,
)
def update_alert(
    alert_id: int,
    alert: AlertUpdate,
    db: Session = Depends(get_db),
):
    return alert_service.update_alert(
        db=db,
        alert_id=alert_id,
        alert_data=alert,
    )