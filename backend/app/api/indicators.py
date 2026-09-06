from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.app.db.database import SessionLocal
from backend.app.schemas.indicator import (
    IndicatorCreate,
    IndicatorResponse,
    IndicatorSearchResponse,
    IndicatorType,
)
from backend.app.services import indicator_service


router = APIRouter(
    prefix="/api/v1/indicators",
    tags=["Indicators"],
)


def get_db():
    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


@router.post(
    "/",
    response_model=IndicatorResponse,
)
def create_indicator(
    indicator: IndicatorCreate,
    db: Session = Depends(get_db),
):
    existing = (
        indicator_service.get_indicator_by_value(
            db,
            indicator.value,
        )
    )

    if existing:
        raise HTTPException(
            status_code=409,
            detail="Indicator already exists",
        )

    return (
        indicator_service.create_indicator(
            db=db,
            indicator_type=indicator.indicator_type,
            value=indicator.value,
        )
    )


@router.get(
    "/",
    response_model=IndicatorSearchResponse,
)
def search_indicators(
    query: str | None = None,
    indicator_type: IndicatorType | None = None,
    page: int = Query(
        default=1,
        ge=1,
    ),
    size: int = Query(
        default=25,
        ge=1,
        le=100,
    ),
    db: Session = Depends(get_db),
):
    return (
        indicator_service.search_indicators(
            db=db,
            query=query,
            indicator_type=indicator_type,
            page=page,
            size=size,
        )
    )


@router.get(
    "/{indicator_id}",
    response_model=IndicatorResponse,
)
def get_indicator(
    indicator_id: int,
    db: Session = Depends(get_db),
):
    indicator = (
        indicator_service.get_indicator(
            db,
            indicator_id,
        )
    )

    if indicator is None:
        raise HTTPException(
            status_code=404,
            detail="Indicator not found",
        )

    return indicator