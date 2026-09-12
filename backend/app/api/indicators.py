from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
)
from sqlalchemy.orm import Session

from backend.app.db.database import SessionLocal
from backend.app.schemas.indicator import (
    IndicatorCreate,
    IndicatorResponse,
    IndicatorSearchResponse,
    IndicatorType,
    IndicatorUpdate,
)
from backend.app.services import indicator_service
from backend.app.services import indicator_scoring_service


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
    status_code=201,
)
def create_indicator(
    indicator: IndicatorCreate,
    db: Session = Depends(get_db),
):
    return indicator_service.create_indicator(
        db=db,
        indicator_data=indicator,
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
    return indicator_service.search_indicators(
        db=db,
        query=query,
        indicator_type=indicator_type,
        page=page,
        size=size,
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


@router.put(
    "/{indicator_id}",
    response_model=IndicatorResponse,
)
def update_indicator(
    indicator_id: int,
    indicator: IndicatorUpdate,
    db: Session = Depends(get_db),
):
    return indicator_service.update_indicator(
        db=db,
        indicator_id=indicator_id,
        indicator_data=indicator,
    )


@router.delete(
    "/{indicator_id}",
    response_model=IndicatorResponse,
)
def delete_indicator(
    indicator_id: int,
    db: Session = Depends(get_db),
):
    indicator = (
        indicator_service.delete_indicator(
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


@router.post(
    "/{indicator_id}/score",
)
def score_indicator(
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

    score = (
        indicator_scoring_service
        .calculate_indicator_score(
            db=db,
            indicator=indicator,
        )
    )

    breakdown = (
        indicator_scoring_service
        .get_indicator_score_breakdown(
            db=db,
            indicator=indicator,
        )
    )

    return {
        "message": "Indicator scored successfully",
        "score": score,
        "breakdown": breakdown,
    }