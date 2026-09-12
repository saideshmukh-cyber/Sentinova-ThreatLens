from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from backend.app.models.indicator import Indicator
from backend.app.services.feed_registry import (
    get_feed_provider,
)
from backend.app.services.indicator_normalizer import (
    normalize_indicator,
)
from backend.app.services.indicator_source_service import (
    add_indicator_source,
)

SOURCE_CONFIDENCE = {
    "urlhaus": 80,
    "threatfox": 85,
    "feodo": 85,
    "malwarebazaar": 90,
    "otx": 75,
    "cisa-kev": 95,
}


def ingest_feed(
    db: Session,
    feed_name: str,
) -> dict:
    provider = get_feed_provider(
        feed_name
    )

    source = provider.name
    confidence = SOURCE_CONFIDENCE.get(
        source,
        70,
    )

    feed_indicators = (
        provider.fetch_indicators()
    )

    inserted = 0
    duplicates = 0
    failed = 0
    sources_added = 0
    unsupported = 0

    for item in feed_indicators:
        try:
            indicator_type = item.get(
                "indicator_type"
            )

            value = item.get(
                "value"
            )

            if not indicator_type or not value:
                failed += 1
                continue

            if indicator_type == "cve":
                unsupported += 1
                continue

            normalized_value = (
                normalize_indicator(
                    indicator_type,
                    value,
                )
            )

            if not normalized_value:
                failed += 1
                continue

            existing = (
                db.query(Indicator)
                .filter(
                    Indicator.value
                    == normalized_value,
                )
                .first()
            )

            if existing:
                duplicates += 1

                add_indicator_source(
                    db=db,
                    indicator_id=existing.id,
                    source=source,
                    confidence=confidence,
                )

                sources_added += 1
                continue

            indicator = Indicator(
                indicator_type=indicator_type,
                value=normalized_value,
            )

            db.add(indicator)

            try:
                db.commit()
                db.refresh(indicator)

                inserted += 1

                add_indicator_source(
                    db=db,
                    indicator_id=indicator.id,
                    source=source,
                    confidence=confidence,
                )

                sources_added += 1


            except IntegrityError:
                db.rollback()

                duplicates += 1

        except Exception:
            db.rollback()
            failed += 1

    return {
        "source": source,
        "fetched": len(feed_indicators),
        "inserted": inserted,
        "duplicates": duplicates,
        "failed": failed,
        "unsupported": unsupported,
        "sources_added": sources_added,
    }

def ingest_urlhaus_feed(
    db: Session,
) -> dict:
    return ingest_feed(
        db=db,
        feed_name="urlhaus",
    )