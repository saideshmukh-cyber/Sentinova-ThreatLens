from sqlalchemy.orm import Session

from backend.app.models.indicator import Indicator
from backend.app.models.enrichment import IndicatorEnrichment
from backend.app.services import enrichment_service


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


def run_enrichment(
    db: Session,
    indicator,
):
    indicator_type = indicator.indicator_type.value
    value = indicator.value

    results = []

    if indicator_type == "IP":
        results.append(
            enrichment_service.enrich_ip(
                db=db,
                indicator_id=indicator.id,
                ip=value,
            )
        )

        results.append(
            enrichment_service.enrich_virustotal(
                db=db,
                indicator_id=indicator.id,
                indicator_type=indicator_type,
                value=value,
            )
        )

    elif indicator_type == "DOMAIN":
        results.append(
            enrichment_service.enrich_domain(
                db=db,
                indicator_id=indicator.id,
                domain=value,
            )
        )

        results.append(
            enrichment_service.enrich_virustotal(
                db=db,
                indicator_id=indicator.id,
                indicator_type=indicator_type,
                value=value,
            )
        )

    elif indicator_type == "HASH":
        results.append(
            enrichment_service.enrich_hash(
                db=db,
                indicator_id=indicator.id,
                value=value,
            )
        )

        results.append(
            enrichment_service.enrich_virustotal(
                db=db,
                indicator_id=indicator.id,
                indicator_type=indicator_type,
                value=value,
            )
        )

    elif indicator_type == "URL":
        return []

    return results