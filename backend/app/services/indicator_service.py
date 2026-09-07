from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from backend.app.db.redis import redis_client
from backend.app.models.enrichment import IndicatorEnrichment
from backend.app.models.indicator import Indicator
from backend.app.schemas.indicator import (
    IndicatorCreate,
    IndicatorUpdate,
)
from backend.app.services.elasticsearch_service import (
    delete_indicator as delete_elasticsearch_indicator,
    index_indicator,
)
from backend.app.services.indicator_normalizer import (
    normalize_indicator,
)


def normalize_indicator_type(
    indicator_type,
):
    if isinstance(
        indicator_type,
        str,
    ):
        return indicator_type.strip().lower()

    if hasattr(
        indicator_type,
        "value",
    ):
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

    try:
        index_indicator(
            db_indicator
        )
    except Exception:
        pass

    return db_indicator


def get_all_indicators(
    db: Session,
):
    return (
        db.query(Indicator)
        .order_by(
            Indicator.created_at.desc()
        )
        .all()
    )


def get_indicator(
    db: Session,
    indicator_id: int,
):
    return (
        db.query(Indicator)
        .filter(
            Indicator.id == indicator_id
        )
        .first()
    )


def get_indicator_by_id(
    db: Session,
    indicator_id: int,
):
    cache_key = (
        f"indicator:{indicator_id}"
    )

    cached_value = redis_client.get(
        cache_key
    )

    indicator = (
        db.query(Indicator)
        .filter(
            Indicator.id == indicator_id
        )
        .first()
    )

    if indicator is None:
        raise HTTPException(
            status_code=404,
            detail="Indicator not found",
        )

    if not cached_value:
        redis_client.set(
            cache_key,
            indicator.value,
            ex=300,
        )

    return indicator


def get_indicator_by_value(
    db: Session,
    value: str,
):
    normalized_value = value.strip().lower()

    return (
        db.query(Indicator)
        .filter(
            Indicator.value
            == normalized_value
        )
        .first()
    )


def list_indicators(
    db: Session,
):
    return (
        db.query(Indicator)
        .order_by(
            Indicator.created_at.desc()
        )
        .all()
    )


def search_indicators(
    db: Session,
    query: str | None,
    indicator_type,
    page: int,
    size: int,
):
    search_query = db.query(
        Indicator
    )

    if indicator_type:
        normalized_type = (
            normalize_indicator_type(
                indicator_type
            )
        )

        search_query = (
            search_query.filter(
                Indicator.indicator_type
                == normalized_type
            )
        )

    if query:
        normalized_query = (
            query.strip().lower()
        )

        search_query = (
            search_query.filter(
                Indicator.value.ilike(
                    f"%{normalized_query}%"
                )
            )
        )

    total = search_query.count()

    items = (
        search_query
        .order_by(
            Indicator.created_at.desc()
        )
        .offset(
            (page - 1) * size
        )
        .limit(size)
        .all()
    )

    return {
        "total": total,
        "page": page,
        "size": size,
        "items": items,
    }


def update_indicator(
    db: Session,
    indicator_id: int,
    indicator_data: IndicatorUpdate,
):
    indicator = get_indicator_by_id(
        db,
        indicator_id,
    )

    normalized_type = (
        normalize_indicator_type(
            indicator_data.indicator_type
        )
    )

    normalized_value = normalize_indicator(
        normalized_type,
        indicator_data.value,
    )

    existing = (
        db.query(Indicator)
        .filter(
            Indicator.value
            == normalized_value,
            Indicator.id
            != indicator_id,
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=409,
            detail="Indicator already exists",
        )

    indicator.indicator_type = (
        normalized_type
    )

    indicator.value = (
        normalized_value
    )

    try:
        db.commit()
        db.refresh(indicator)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=409,
            detail="Indicator already exists",
        )

    redis_client.delete(
        f"indicator:{indicator_id}"
    )

    try:
        index_indicator(
            indicator
        )
    except Exception:
        pass

    return indicator


def delete_indicator(
    db: Session,
    indicator_id: int,
):
    indicator = get_indicator(
        db,
        indicator_id,
    )

    if indicator is None:
        return None

    db.query(
        IndicatorEnrichment
    ).filter(
        IndicatorEnrichment.indicator_id
        == indicator_id
    ).delete(
        synchronize_session=False
    )

    db.delete(indicator)
    db.commit()

    redis_client.delete(
        f"indicator:{indicator_id}"
    )

    try:
        delete_elasticsearch_indicator(
            indicator_id
        )
    except Exception:
        pass

    return indicator