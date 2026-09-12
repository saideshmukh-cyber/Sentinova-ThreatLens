from datetime import datetime

from sqlalchemy.orm import Session

from backend.app.models.indicator import Indicator
from backend.app.models.indicator_source import IndicatorSource
from backend.app.models.enrichment import IndicatorEnrichment
from backend.app.models.security_event import SecurityEvent
from backend.app.services.scoring_service import (
    calculate_indicator_severity,
)


def calculate_indicator_score(
    db: Session,
    indicator: Indicator,
) -> int:
    sources = (
        db.query(IndicatorSource)
        .filter(
            IndicatorSource.indicator_id
            == indicator.id
        )
        .all()
    )

    source_confidence = max(
        (
            source.confidence
            for source in sources
        ),
        default=0,
    )

    source_count = len(sources)

    internal_sightings = (
        db.query(SecurityEvent)
        .filter(
            SecurityEvent.indicator_value
            == indicator.value
        )
        .count()
    )

    enrichments = (
        db.query(IndicatorEnrichment)
        .filter(
            IndicatorEnrichment.indicator_id
            == indicator.id
        )
        .all()
    )

    enrichment_score = 0

    for enrichment in enrichments:
        data = enrichment.data

        if not isinstance(data, dict):
            continue

        if "severity_score" in data:
            enrichment_score = max(
                enrichment_score,
                int(
                    data.get(
                        "severity_score",
                        0,
                    )
                    or 0
                ),
            )

    last_seen = None

    for source in sources:
        if source.last_seen is not None:
            if (
                last_seen is None
                or source.last_seen > last_seen
            ):
                last_seen = source.last_seen

    score = calculate_indicator_severity(
        source_confidence=source_confidence,
        source_count=source_count,
        internal_sightings=internal_sightings,
        enrichment_score=enrichment_score,
        last_seen=last_seen,
    )

    indicator.severity_score = score

    db.commit()
    db.refresh(indicator)

    return score


def get_indicator_score_breakdown(
    db: Session,
    indicator: Indicator,
) -> dict:
    sources = (
        db.query(IndicatorSource)
        .filter(
            IndicatorSource.indicator_id
            == indicator.id
        )
        .all()
    )

    source_confidence = max(
        (
            source.confidence
            for source in sources
        ),
        default=0,
    )

    source_count = len(sources)

    internal_sightings = (
        db.query(SecurityEvent)
        .filter(
            SecurityEvent.indicator_value
            == indicator.value
        )
        .count()
    )

    enrichment_score = 0

    enrichments = (
        db.query(IndicatorEnrichment)
        .filter(
            IndicatorEnrichment.indicator_id
            == indicator.id
        )
        .all()
    )

    for enrichment in enrichments:
        if not isinstance(
            enrichment.data,
            dict,
        ):
            continue

        enrichment_score = max(
            enrichment_score,
            int(
                enrichment.data.get(
                    "severity_score",
                    0,
                )
                or 0
            ),
        )

    return {
        "indicator_id": indicator.id,
        "severity_score": indicator.severity_score,
        "source_confidence": source_confidence,
        "source_count": source_count,
        "internal_sightings": internal_sightings,
        "enrichment_score": enrichment_score,
    }