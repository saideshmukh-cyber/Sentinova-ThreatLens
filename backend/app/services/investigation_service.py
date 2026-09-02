from sqlalchemy.orm import Session

from backend.app.models.indicator import Indicator
from backend.app.models.enrichment import IndicatorEnrichment

def create_indicator(
    db: Session,
    indicator_type,
    value: str,
):
    indicator = Indicator(
        indicator_type=indicator_type,
        value=value,
    )

    db.add(indicator)
    db.commit()
    db.refresh(indicator)

    return indicator

def get_or_create_indicator(
    db: Session,
    indicator_type,
    value: str,
):
    existing = (
        db.query(Indicator)
        .filter(
            Indicator.indicator_type == indicator_type,
            Indicator.value == value,
        )
        .first()
    )

    if existing:
        return existing

    return create_indicator(
        db=db,
        indicator_type=indicator_type,
        value=value,
    )

def get_enrichments(
    db: Session,
    indicator_id: int,
):
    return (
        db.query(IndicatorEnrichment)
        .filter(
        IndicatorEnrichment.indicator_id == indicator_id
        )
        .all()
    )