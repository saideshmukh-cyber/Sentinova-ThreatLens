from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from backend.app.db.database import SessionLocal
from backend.app.models.indicator import Indicator
from backend.app.schemas.indicator import (
    IndicatorCreate,
    IndicatorResponse,
    IndicatorUpdate,
)


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
    db_indicator = Indicator(
        indicator_type=indicator.indicator_type,
        value=indicator.value,
    )

    db.add(db_indicator)

    try:
        db.commit()
        db.refresh(db_indicator)

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Indicator already exists",
        )

    return db_indicator


@router.get("/", response_model=list[IndicatorResponse])
def list_indicators(
    db: Session = Depends(get_db),
):
    return db.query(Indicator).all()


@router.get("/{indicator_id}", response_model=IndicatorResponse)
def get_indicator(
    indicator_id: int,
    db: Session = Depends(get_db),
):
    indicator = db.query(Indicator).filter(
        Indicator.id == indicator_id
    ).first()

    if indicator is None:
        raise HTTPException(
            status_code=404,
            detail="Indicator not found",
        )

    return indicator


@router.delete("/{indicator_id}")
def delete_indicator(
    indicator_id: int,
    db: Session = Depends(get_db),
):
    indicator = db.query(Indicator).filter(
        Indicator.id == indicator_id
    ).first()

    if indicator is None:
        raise HTTPException(
            status_code=404,
            detail="Indicator not found",
        )

    db.delete(indicator)
    db.commit()

    return {
        "detail": "Indicator deleted successfully"
    }


@router.put("/{indicator_id}", response_model=IndicatorResponse)
def update_indicator(
    indicator_id: int,
    indicator_data: IndicatorUpdate,
    db: Session = Depends(get_db),
):
    indicator = db.query(Indicator).filter(
        Indicator.id == indicator_id
    ).first()

    if indicator is None:
        raise HTTPException(
            status_code=404,
            detail="Indicator not found",
        )

    indicator.indicator_type = indicator_data.indicator_type
    indicator.value = indicator_data.value

    try:
        db.commit()
        db.refresh(indicator)

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Indicator already exists",
        )

    return indicator