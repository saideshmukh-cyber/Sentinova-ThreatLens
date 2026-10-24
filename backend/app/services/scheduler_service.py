from datetime import datetime, timedelta

from backend.app.db.database import SessionLocal
from backend.app.models.feed_config import FeedConfig
from backend.app.services.feed_service import ingest_feed


def run_due_feeds() -> list[dict]:
    db = SessionLocal()
    results = []
    try:
        now = datetime.utcnow()
        rows = db.query(FeedConfig).filter(FeedConfig.enabled.is_(True)).all()
        for row in rows:
            due = row.last_run_at is None or row.last_run_at + timedelta(minutes=row.schedule_minutes) <= now
            if not due:
                continue
            try:
                result = ingest_feed(db, row.name)
                row.last_run_at = datetime.utcnow()
                db.commit()
                results.append(result)
            except Exception as exc:
                db.rollback()
                results.append({"feed": row.name, "error": str(exc)})
        return results
    finally:
        db.close()
