from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.db.database import SessionLocal
from backend.app.schemas.security_event import (
    SecurityEventCreate,
    SecurityEventResponse,
)
from backend.app.services import security_event_service


router = APIRouter(
    prefix="/api/v1/security-events",
    tags=["Security Events"],
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


@router.post(
    "/",
)
async def create_security_event(
    event: SecurityEventCreate,
    db: Session = Depends(get_db),
):
    result = await security_event_service.ingest_security_event(
        db=db,
        event=event,
    )

    return {
        "event": SecurityEventResponse.model_validate(
            result["event"]
        ),
        "alerts_created": result["alerts_created"],
    }


@router.get(
    "/",
    response_model=list[SecurityEventResponse],
)
def get_security_events(
    db: Session = Depends(get_db),
):
    return security_event_service.get_security_events(
        db=db,
    )


@router.get(
    "/correlate/{indicator_value}",
)
def correlate_indicator(
    indicator_value: str,
    db: Session = Depends(get_db),
):
    events = security_event_service.find_events_for_indicator(
        db=db,
        indicator_value=indicator_value,
    )

    return {
        "indicator": indicator_value,
        "match_count": len(events),
        "events": events,
    }