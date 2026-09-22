from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.db.database import SessionLocal
from backend.app.providers.feed_registry import list_feeds
from backend.app.services import feed_service

router = APIRouter(prefix="/api/v1/feeds", tags=["Feeds"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/")
def get_feeds():
    return list_feeds()


@router.post("/{feed_name}/run")
def run_feed(feed_name: str, db: Session = Depends(get_db)):
    try:
        return feed_service.ingest_feed(db, feed_name)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Feed ingestion failed: {exc}") from exc
