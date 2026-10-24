from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.db.database import SessionLocal
from backend.app.schemas.alert import AlertResponse, AlertUpdate
from backend.app.schemas.incident import IncidentCreate, IncidentResponse
from backend.app.services import alert_service

router = APIRouter(prefix="/api/v1/alerts", tags=["Alerts"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/", response_model=list[AlertResponse])
def get_alerts(db: Session = Depends(get_db)):
    return alert_service.get_alerts(db)


@router.patch("/{alert_id}", response_model=AlertResponse)
async def update_alert(
    alert_id: int,
    alert: AlertUpdate,
    db: Session = Depends(get_db),
):
    return await alert_service.update_alert(db=db, alert_id=alert_id, alert_data=alert)


@router.post("/{alert_id}/escalate", response_model=AlertResponse)
async def escalate_alert(alert_id: int, db: Session = Depends(get_db)):
    return await alert_service.escalate_alert(db=db, alert_id=alert_id)


@router.post("/{alert_id}/incident", response_model=IncidentResponse, status_code=201)
async def create_incident_from_alert(
    alert_id: int,
    incident: IncidentCreate,
    db: Session = Depends(get_db),
):
    return await alert_service.create_incident_from_alert(
        db=db, alert_id=alert_id, incident_data=incident
    )


@router.post("/{alert_id}/incident/{incident_id}", response_model=AlertResponse)
async def attach_alert_to_incident(
    alert_id: int,
    incident_id: int,
    db: Session = Depends(get_db),
):
    return await alert_service.attach_alert_to_incident(
        db=db, alert_id=alert_id, incident_id=incident_id
    )
