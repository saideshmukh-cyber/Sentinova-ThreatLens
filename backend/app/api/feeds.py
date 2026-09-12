from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)
from sqlalchemy.orm import Session

from backend.app.db.database import SessionLocal
from backend.app.services import feed_registry
from backend.app.services import feed_service
from backend.app.services.realtime_service import (
    broadcast_high_severity_indicator,
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


@router.get("/")
def get_available_feeds():
    return {
        "count": len(
            feed_registry.FEED_PROVIDERS
        ),
        "feeds": (
            feed_registry
            .get_available_feeds()
        ),
    }


@router.post("/{feed_name}/run")
async def run_feed(
    feed_name: str,
    db: Session = Depends(get_db),
):
    try:
        return feed_service.ingest_feed(
            db=db,
            feed_name=feed_name,
        )

        return result

    except ValueError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        )

    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=(
                f"Feed execution failed: {exc}"
            ),
        )