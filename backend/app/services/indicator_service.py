from sqlalchemy.orm import Session

from backend.app.models.indicator import Indicator


def create_indicator(
    db: Session,
    indicator_type,
    value,
):
    indicator = Indicator(
        indicator_type=indicator_type,
        value=value,
    )

    db.add(indicator)
    db.commit()
    db.refresh(indicator)

    return indicator


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


def get_indicator_by_value(
    db: Session,
    value: str,
):
    return (
        db.query(Indicator)
        .filter(
            Indicator.value == value
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
    indicator_type: str | None,
    page: int,
    size: int,
):
    search_query = db.query(
        Indicator
    )

    if indicator_type:
        search_query = (
            search_query.filter(
                Indicator.indicator_type
                == indicator_type
            )
        )

    if query:
        search_query = (
            search_query.filter(
                Indicator.value.ilike(
                    f"%{query}%"
                )
            )
        )

    total = search_query.count()

    items = (
        search_query.order_by(
            Indicator.created_at.desc()
        )
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )

    return {
        "total": total,
        "page": page,
        "size": size,
        "items": items,
    }