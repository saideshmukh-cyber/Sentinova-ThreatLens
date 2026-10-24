from datetime import datetime

from sqlalchemy.orm import Session

from backend.app.models.indicator import Indicator, IndicatorType
from backend.app.models.indicator_source import IndicatorSource
from backend.app.providers.feed_registry import get_feed_provider
from backend.app.services.elasticsearch_service import index_indicator
from backend.app.services.indicator_normalizer import normalize_indicator

CONFIDENCE = {
    "urlhaus": 80,
    "threatfox": 85,
    "feodo-tracker": 85,
    "malwarebazaar": 90,
    "otx": 75,
    "cisa-kev": 95,
}

SUPPORTED_TYPES = {member.value for member in IndicatorType}


def ingest_feed(db: Session, feed_name: str):
    name = feed_name.strip().lower()
    provider = get_feed_provider(name)
    if provider is None:
        raise ValueError(f"Unknown feed: {name}")

    rows = provider.fetch_indicators()
    created = 0
    updated_sources = 0
    skipped = 0
    unsupported = 0
    now = datetime.utcnow()
    confidence = CONFIDENCE.get(name, 50)

    for row in rows:
        indicator_type = row.get("indicator_type")
        value = row.get("value")
        if indicator_type not in SUPPORTED_TYPES or not value:
            if indicator_type == "unsupported":
                unsupported += 1
            else:
                skipped += 1
            continue
        try:
            normalized = normalize_indicator(indicator_type, value)
        except Exception:
            skipped += 1
            continue
        indicator = db.query(Indicator).filter(Indicator.value == normalized).first()
        if indicator is None:
            indicator = Indicator(
                indicator_type=indicator_type,
                value=normalized,
                severity_score=0,
                first_seen=now,
                last_seen=now,
                ttl_days=30,
            )
            db.add(indicator)
            db.flush()
            created += 1
        else:
            indicator.last_seen = now
        source = db.query(IndicatorSource).filter(
            IndicatorSource.indicator_id == indicator.id,
            IndicatorSource.source == name,
        ).first()
        if source is None:
            source = IndicatorSource(indicator_id=indicator.id, source=name, confidence=confidence)
            db.add(source)
            updated_sources += 1
        else:
            source.confidence = max(source.confidence, confidence)
            source.last_seen = now
        try:
            db.flush()
            index_indicator(indicator)
        except Exception:
            pass

    db.commit()
    return {
        "feed": name,
        "fetched": len(rows),
        "created": created,
        "sources_added_or_updated": updated_sources,
        "skipped": skipped,
        "unsupported": unsupported,
    }


def ingest_urlhaus_feed(db: Session):
    return ingest_feed(db, "urlhaus")
