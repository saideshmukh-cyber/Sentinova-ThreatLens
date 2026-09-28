from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.db.database import SessionLocal
from backend.app.schemas.incident import IncidentCreate, IncidentResponse, IncidentUpdate
from backend.app.schemas.incident_timeline import IncidentTimelineCreate, IncidentTimelineResponse
from backend.app.services import incident_service, incident_timeline_service

router = APIRouter(prefix="/api/v1/incidents", tags=["Incidents"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=IncidentResponse, status_code=201)
def create_incident(incident: IncidentCreate, db: Session = Depends(get_db)):
    return incident_service.create_incident(db, incident)


@router.get("/", response_model=list[IncidentResponse])
def get_incidents(db: Session = Depends(get_db)):
    return incident_service.get_incidents(db)


@router.get("/{incident_id}", response_model=IncidentResponse)
def get_incident(incident_id: int, db: Session = Depends(get_db)):
    return incident_service.get_incident(db, incident_id)


@router.put("/{incident_id}", response_model=IncidentResponse)
def update_incident(incident_id: int, incident: IncidentUpdate, db: Session = Depends(get_db)):
    return incident_service.update_incident(db, incident_id, incident)


@router.delete("/{incident_id}", response_model=IncidentResponse)
def delete_incident(incident_id: int, db: Session = Depends(get_db)):
    return incident_service.delete_incident(db, incident_id)


@router.post("/{incident_id}/timeline", response_model=IncidentTimelineResponse, status_code=201)
def create_timeline_entry(incident_id: int, timeline: IncidentTimelineCreate, db: Session = Depends(get_db)):
    incident_service.get_incident(db, incident_id)
    return incident_timeline_service.create_timeline_entry(db=db, incident_id=incident_id, timeline_data=timeline)


@router.get("/{incident_id}/timeline", response_model=list[IncidentTimelineResponse])
def get_incident_timeline(incident_id: int, db: Session = Depends(get_db)):
    incident_service.get_incident(db, incident_id)
    return incident_timeline_service.get_timeline_for_incident(db, incident_id)
