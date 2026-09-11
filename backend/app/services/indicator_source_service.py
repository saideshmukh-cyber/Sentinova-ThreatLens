from datetime import datetime

from sqlalchemy.orm import Session

from backend.app.models.indicator_source import (
    IndicatorSource,
)


def add_indicator_source(
    db: Session,
    indicator_id: int,
    source: str,
    confidence: int = 50,
):
    existing = (
        db.query(IndicatorSource)
        .filter(
            IndicatorSource.indicator_id
            == indicator_id,
            IndicatorSource.source
            == source,
        )
        .first()
    )

    now = datetime.utcnow()

    if existing:
        existing.last_seen = now

        if confidence > existing.confidence:
            existing.confidence = confidence

        db.commit()
        db.refresh(existing)

        return existing

    source_record = IndicatorSource(
        indicator_id=indicator_id,
        source=source,
        confidence=max(
            0,
            min(confidence, 100),
        ),
        first_seen=now,
        last_seen=now,
    )

    db.add(source_record)
    db.commit()
    db.refresh(source_record)

    return source_record


def get_indicator_sources(
    db: Session,
    indicator_id: int,
):
    return (
        db.query(IndicatorSource)
        .filter(
            IndicatorSource.indicator_id
            == indicator_id
        )
        .order_by(
            IndicatorSource.confidence.desc()
        )
        .all()
    )