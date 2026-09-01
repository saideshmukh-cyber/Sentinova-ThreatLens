from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.db.database import SessionLocal
from backend.app.schemas.indicator import (
    IndicatorCreate,
    IndicatorResponse,
    IndicatorUpdate,
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


@router.post("/", response_model=IndicatorResponse)
def create_indicator(
    indicator: IndicatorCreate,
    db: Session = Depends(get_db),
):
    return indicator_service.create_indicator(
        db,
        indicator,
    )


@router.get("/", response_model=list[IndicatorResponse])
def list_indicators(
    db: Session = Depends(get_db),
):
    return indicator_service.get_all_indicators(db)

@router.get("/{indicator_id}", response_model=IndicatorResponse)
def get_indicator(
    indicator_id: int,
    db: Session = Depends(get_db),
):
    return indicator_service.get_indicator_by_id(
        db,
        indicator_id,
    )


@router.delete("/{indicator_id}")
def delete_indicator(
    indicator_id: int,
    db: Session = Depends(get_db),
):
    return indicator_service.delete_indicator(
        db,
        indicator_id,
    )


@router.put("/{indicator_id}", response_model=IndicatorResponse)
def update_indicator(
    indicator_id: int,
    indicator_data: IndicatorUpdate,
    db: Session = Depends(get_db),
):
    return indicator_service.update_indicator(
        db,
        indicator_id,
        indicator_data,
    )