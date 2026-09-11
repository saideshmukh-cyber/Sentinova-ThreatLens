from fastapi import (
    APIRouter,
    Depends,
)
from sqlalchemy.orm import Session

from backend.app.db.database import SessionLocal
from backend.app.services import (
    feed_service,
)


router = APIRouter(
    prefix="/api/v1/feeds",
    tags=["Feeds"],
)


def get_db():
    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


@router.post(
    "/urlhaus",
)
def ingest_urlhaus(
    db: Session = Depends(get_db),
):
    return feed_service.ingest_urlhaus_feed(
        db
    )