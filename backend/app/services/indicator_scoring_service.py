from backend.app.models.enrichment import IndicatorEnrichment
from backend.app.models.indicator import Indicator
from backend.app.models.indicator_source import IndicatorSource
from backend.app.models.security_event import SecurityEvent
from backend.app.services.scoring_service import calculate_indicator_severity


def calculate_indicator_score(db, indicator: Indicator):
    sources = db.query(IndicatorSource).filter(IndicatorSource.indicator_id == indicator.id).all()
    source_confidence = max((source.confidence for source in sources), default=0)
    source_count = len(sources)
    internal_sightings = db.query(SecurityEvent).filter(
        SecurityEvent.indicator_value == indicator.value
    ).count()
    enrichments = db.query(IndicatorEnrichment).filter(
        IndicatorEnrichment.indicator_id == indicator.id
    ).all()
    enrichment_score = 0
    for enrichment in enrichments:
        data = enrichment.data
        if isinstance(data, dict):
            enrichment_score = max(enrichment_score, int(data.get("severity_score", 0) or 0))

    last_seen = max((source.last_seen for source in sources if source.last_seen), default=None)
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


def calculate_indicator_score_transition(db, indicator: Indicator):
    previous_score = int(indicator.severity_score or 0)
    score = calculate_indicator_score(db, indicator)
    return {
        "previous_score": previous_score,
        "score": score,
        "crossed_high_severity": previous_score < 80 <= score,
    }


def get_indicator_score_breakdown(db, indicator: Indicator):
    sources = db.query(IndicatorSource).filter(IndicatorSource.indicator_id == indicator.id).all()
    sightings = db.query(SecurityEvent).filter(SecurityEvent.indicator_value == indicator.value).count()
    enrichments = db.query(IndicatorEnrichment).filter(IndicatorEnrichment.indicator_id == indicator.id).all()
    enrichment_score = 0
    for enrichment in enrichments:
        if isinstance(enrichment.data, dict):
            enrichment_score = max(enrichment_score, int(enrichment.data.get("severity_score", 0) or 0))
    return {
        "source_confidence": max((s.confidence for s in sources), default=0),
        "source_count": len(sources),
        "internal_sightings": sightings,
        "enrichment_score": enrichment_score,
        "severity_score": indicator.severity_score,
    }
