from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.db.database import SessionLocal
from backend.app.schemas.security_event import (
    SecurityEventCreate,
    SecurityEventResponse,
)
from backend.app.services import (
    security_event_service,
)


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
    response_model=SecurityEventResponse,
    status_code=201,
)
async def create_security_event(
    event: SecurityEventCreate,
    db: Session = Depends(get_db),
):
    result = (
        await security_event_service
        .ingest_security_event(
            db,
            event,
        )
    )

    return result["event"]


@router.get(
    "/",
    response_model=list[SecurityEventResponse],
)
def get_security_events(
    db: Session = Depends(get_db),
):
    return (
        security_event_service
        .get_security_events(db)
    )