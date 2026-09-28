from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.db.database import SessionLocal
from backend.app.models.feed_config import FeedConfig
from backend.app.providers.feed_registry import list_feeds
from backend.app.schemas.feed import FeedConfigUpdate
from backend.app.services import feed_service

router = APIRouter(prefix="/api/v1/feeds", tags=["Feeds"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _ensure_configs(db: Session):
    existing = {row.name for row in db.query(FeedConfig).all()}
    changed = False
    for item in list_feeds():
        if item["name"] not in existing:
            db.add(FeedConfig(name=item["name"], description=item["description"], enabled=True, schedule_minutes=1440))
            changed = True
    if changed:
        db.commit()


def _serialize(row: FeedConfig):
    return {
        "name": row.name,
        "description": row.description,
        "enabled": row.enabled,
        "schedule_minutes": row.schedule_minutes,
        "last_run_at": row.last_run_at.isoformat() if row.last_run_at else None,
    }


@router.get("/")
def get_feeds(db: Session = Depends(get_db)):
    _ensure_configs(db)
    return [_serialize(row) for row in db.query(FeedConfig).order_by(FeedConfig.name.asc()).all()]


@router.put("/{feed_name}")
def update_feed(feed_name: str, data: FeedConfigUpdate, db: Session = Depends(get_db)):
    _ensure_configs(db)
    row = db.query(FeedConfig).filter(FeedConfig.name == feed_name.strip().lower()).first()
    if row is None:
        raise HTTPException(status_code=404, detail="Feed not found")
    if data.enabled is not None:
        row.enabled = data.enabled
    if data.schedule_minutes is not None:
        row.schedule_minutes = data.schedule_minutes
    db.commit()
    db.refresh(row)
    return _serialize(row)


@router.post("/{feed_name}/run")
def run_feed(feed_name: str, db: Session = Depends(get_db)):
    name = feed_name.strip().lower()
    try:
        result = feed_service.ingest_feed(db, name)
        row = db.query(FeedConfig).filter(FeedConfig.name == name).first()
        if row:
            row.last_run_at = datetime.utcnow()
            db.commit()
        return result
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Feed ingestion failed: {exc}") from exc
