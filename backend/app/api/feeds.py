from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.db.database import SessionLocal
from backend.app.services import feed_registry
from backend.app.services import feed_service


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
        "feeds": (
            feed_registry
            .get_available_feeds()
        )
    }


@router.post("/urlhaus")
def ingest_urlhaus(
    db: Session = Depends(get_db),
):
    return (
        feed_service
        .ingest_urlhaus_feed(db)
    )


@router.post("/{feed_name}/run")
def run_feed(
    feed_name: str,
    db: Session = Depends(get_db),
):
    try:
        provider = (
            feed_registry
            .get_feed_provider(
                feed_name
            )
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        )

    if feed_name.lower() == "urlhaus":
        return (
            feed_service
            .ingest_urlhaus_feed(db)
        )

    indicators = (
        provider.fetch_indicators()
    )

    return {
        "source": feed_name,
        "fetched": len(indicators),
        "message": (
            "Provider executed successfully."
        ),
    }