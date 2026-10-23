from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.db.database import SessionLocal
from backend.app.schemas.security_event import SecurityEventCreate, SecurityEventResponse
from backend.app.services import security_event_service

router = APIRouter(prefix="/api/v1/integrations", tags=["Integrations"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/webhook/{source}", response_model=SecurityEventResponse, status_code=201)
async def ingest_webhook(source: str, event: SecurityEventCreate, db: Session = Depends(get_db)):
    """Authenticated inbound hook for SIEM/EDR/ticketing event ingestion."""
    normalized = event.model_copy(update={"source": source.strip() or event.source})
    return await security_event_service.ingest_security_event(db=db, event=normalized)
