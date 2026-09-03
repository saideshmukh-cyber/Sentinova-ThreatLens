from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from backend.app.models.indicator import Indicator
from backend.app.providers.urlhaus_provider import (
    URLhausProvider,
)
from backend.app.services.indicator_normalizer import (
    normalize_indicator,
)


def ingest_urlhaus_feed(
    db: Session,
) -> dict:
    provider = URLhausProvider()

    feed_indicators = (
        provider.fetch_indicators()
    )

    inserted = 0
    duplicates = 0
    failed = 0

    for item in feed_indicators:
        indicator_type = item[
            "indicator_type"
        ]

        value = normalize_indicator(
            indicator_type,
            item["value"],
        )

        if not (
            value.startswith("http://")
            or value.startswith("https://")
        ):
            failed += 1
            continue

        existing = (
            db.query(Indicator)
            .filter(
                Indicator.value == value
            )
            .first()
        )

        if existing:
            duplicates += 1
            continue

        indicator = Indicator(
            indicator_type=indicator_type,
            value=value,
        )

        db.add(indicator)

        try:
            db.commit()
            db.refresh(indicator)
            inserted += 1

        except IntegrityError:
            db.rollback()
            duplicates += 1

        except Exception:
            db.rollback()
            failed += 1

    return {
        "source": "urlhaus",
        "fetched": len(feed_indicators),
        "inserted": inserted,
        "duplicates": duplicates,
        "failed": failed,
    }