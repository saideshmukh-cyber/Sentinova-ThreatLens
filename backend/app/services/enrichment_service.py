from sqlalchemy.orm import Session

from backend.app.models.enrichment import IndicatorEnrichment


def create_enrichment(
    db: Session,
    indicator_id: int,
    source: str,
    data: dict,
):
    enrichment = IndicatorEnrichment(
        indicator_id=indicator_id,
        source=source,
        data=data,
    )

    db.add(enrichment)
    db.commit()
    db.refresh(enrichment)

    return enrichment


def get_enrichments_for_indicator(
    db: Session,
    indicator_id: int,
):
    return db.query(IndicatorEnrichment).filter(
        IndicatorEnrichment.indicator_id == indicator_id
    ).all()