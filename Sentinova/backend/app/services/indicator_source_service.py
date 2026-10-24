from datetime import datetime

from sqlalchemy.orm import Session

from backend.app.models.indicator_source import IndicatorSource


def add_indicator_source(db: Session, indicator_id: int, source: str, confidence: int = 50):
    normalized_source = source.strip().lower()
    now = datetime.utcnow()
    existing = db.query(IndicatorSource).filter(
        IndicatorSource.indicator_id == indicator_id,
        IndicatorSource.source == normalized_source,
    ).first()
    if existing:
        existing.confidence = max(existing.confidence, max(0, min(confidence, 100)))
        existing.last_seen = now
        db.commit()
        db.refresh(existing)
        return existing

    record = IndicatorSource(
        indicator_id=indicator_id,
        source=normalized_source,
        confidence=max(0, min(confidence, 100)),
        first_seen=now,
        last_seen=now,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def get_indicator_sources(db: Session, indicator_id: int):
    return db.query(IndicatorSource).filter(
        IndicatorSource.indicator_id == indicator_id
    ).order_by(IndicatorSource.last_seen.desc()).all()
