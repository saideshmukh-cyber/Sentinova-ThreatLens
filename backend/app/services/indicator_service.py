from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from backend.app.db.redis import redis_client
from backend.app.models.indicator import Indicator
from backend.app.models.enrichment import IndicatorEnrichment
from backend.app.schemas.indicator import IndicatorCreate, IndicatorUpdate
from backend.app.services.indicator_normalizer import normalize_indicator


def normalize_indicator_type(indicator_type):
    if isinstance(indicator_type, str):
        return indicator_type.strip().lower()

    if hasattr(indicator_type, "value"):
        return indicator_type.value.strip().lower()

    return indicator_type


def create_indicator(
    db: Session,
    indicator_data: IndicatorCreate,
):
    normalized_type = normalize_indicator_type(
        indicator_data.indicator_type
    )

    normalized_value = normalize_indicator(
        normalized_type,
        indicator_data.value,
    )

    db_indicator = Indicator(
        indicator_type=normalized_type,
        value=normalized_value,
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


def get_all_indicators(db: Session):
    return db.query(Indicator).all()


def get_indicator_by_id(
    db: Session,
    indicator_id: int,
):
    cache_key = f"indicator:{indicator_id}"

    cached_value = redis_client.get(cache_key)

    if cached_value:
        return db.query(Indicator).filter(
            Indicator.id == indicator_id
        ).first()

    indicator = db.query(Indicator).filter(
        Indicator.id == indicator_id
    ).first()

    if indicator is None:
        raise HTTPException(
            status_code=404,
            detail="Indicator not found",
        )

    redis_client.set(
        cache_key,
        indicator.value,
        ex=300,
    )

    return indicator


def delete_indicator(
    db: Session,
    indicator_id: int,
):
    indicator = get_indicator(db, indicator_id)

    if indicator is None:
        return None

    db.query(IndicatorEnrichment).filter(
        IndicatorEnrichment.indicator_id == indicator_id
    ).delete(
        synchronize_session=False
    )

    db.delete(indicator)
    db.commit()

    return indicator


def update_indicator(
    db: Session,
    indicator_id: int,
    indicator_data: IndicatorUpdate,
):
    indicator = get_indicator_by_id(
        db,
        indicator_id,
    )

    normalized_type = normalize_indicator_type(
        indicator_data.indicator_type
    )

    normalized_value = normalize_indicator(
        normalized_type,
        indicator_data.value,
    )

    indicator.indicator_type = normalized_type
    indicator.value = normalized_value

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


def get_indicator(
    db: Session,
    indicator_id: int,
):
    return db.query(Indicator).filter(
        Indicator.id == indicator_id
    ).first()