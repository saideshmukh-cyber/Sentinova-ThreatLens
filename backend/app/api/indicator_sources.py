from fastapi import (
    APIRouter,
    Depends,
)
from sqlalchemy.orm import Session

from backend.app.db.database import SessionLocal
from backend.app.schemas.indicator_source import (
    IndicatorSourceResponse,
)
from backend.app.services import (
    indicator_source_service,
)


router = APIRouter(
    prefix="/api/v1/indicators",
    tags=["Indicator Sources"],
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


@router.get(
    "/{indicator_id}/sources",
    response_model=list[
        IndicatorSourceResponse
    ],
)
def get_sources(
    indicator_id: int,
    db: Session = Depends(get_db),
):
    return (
        indicator_source_service
        .get_indicator_sources(
            db,
            indicator_id,
        )
    )