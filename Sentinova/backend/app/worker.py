import asyncio
import logging

from backend.app.config import settings
from backend.app.db.database import SessionLocal
from backend.app.services.maintenance_service import expire_stale_indicators
from backend.app.services.scheduler_service import run_due_feeds

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("threatlens.worker")


async def main():
    interval = max(30, settings.feed_scheduler_interval_minutes * 60)
    while True:
        db = SessionLocal()
        try:
            expire_stale_indicators(db)
            db.commit()
        except Exception:
            db.rollback()
            logger.exception("Maintenance cycle failed")
        finally:
            db.close()
        if settings.feed_scheduler_enabled:
            try:
                await asyncio.to_thread(run_due_feeds)
            except Exception:
                logger.exception("Feed cycle failed")
        await asyncio.sleep(interval)


if __name__ == "__main__":
    asyncio.run(main())
