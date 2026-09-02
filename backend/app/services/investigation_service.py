from sqlalchemy.orm import Session

from backend.app.models.indicator import Indicator
from backend.app.models.enrichment import IndicatorEnrichment
from backend.app.services import enrichment_service
from backend.app.services.indicator_normalizer import normalize_indicator


def normalize_indicator_type(indicator_type):
    if hasattr(indicator_type, "value"):
        indicator_type = indicator_type.value

    if isinstance(indicator_type, str):
        return indicator_type.strip().lower()

    return indicator_type


def create_indicator(
    db: Session,
    indicator_type,
    value: str,
):
    normalized_type = normalize_indicator_type(
        indicator_type
    )

    normalized_value = normalize_indicator(
        normalized_type,
        value,
    )

    indicator = Indicator(
        indicator_type=normalized_type,
        value=normalized_value,
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
    normalized_type = normalize_indicator_type(
        indicator_type
    )

    normalized_value = normalize_indicator(
        normalized_type,
        value,
    )

    existing = (
        db.query(Indicator)
        .filter(
            Indicator.indicator_type == normalized_type,
            Indicator.value == normalized_value,
        )
        .first()
    )

    if existing:
        return existing

    return create_indicator(
        db=db,
        indicator_type=normalized_type,
        value=normalized_value,
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


def run_domain_enrichment(
    db: Session,
    indicator,
):
    return enrichment_service.enrich_domain(
        db=db,
        indicator_id=indicator.id,
        domain=indicator.value,
    )


def run_ip_enrichment(
    db: Session,
    indicator,
):
    return enrichment_service.enrich_ip(
        db=db,
        indicator_id=indicator.id,
        ip=indicator.value,
    )


def run_hash_enrichment(
    db: Session,
    indicator,
):
    return enrichment_service.enrich_hash(
        db=db,
        indicator_id=indicator.id,
        value=indicator.value,
    )


def run_local_enrichment(
    db: Session,
    indicator,
):
    indicator_type = normalize_indicator_type(
        indicator.indicator_type
    )

    if indicator_type == "domain":
        return run_domain_enrichment(
            db=db,
            indicator=indicator,
        )

    if indicator_type == "ip":
        return run_ip_enrichment(
            db=db,
            indicator=indicator,
        )

    if indicator_type == "hash":
        return run_hash_enrichment(
            db=db,
            indicator=indicator,
        )

    return None


def run_virustotal_enrichment(
    db: Session,
    indicator,
):
    indicator_type = normalize_indicator_type(
        indicator.indicator_type
    )

    if indicator_type not in {"ip", "domain", "hash"}:
        return None

    return enrichment_service.enrich_virustotal(
        db=db,
        indicator_id=indicator.id,
        indicator_type=indicator_type,
        value=indicator.value,
    )


def investigate_indicator(
    db: Session,
    indicator,
):
    enrichments = []

    local_enrichment = run_local_enrichment(
        db=db,
        indicator=indicator,
    )

    if local_enrichment is not None:
        enrichments.append(local_enrichment)

    virustotal_enrichment = run_virustotal_enrichment(
        db=db,
        indicator=indicator,
    )

    if virustotal_enrichment is not None:
        enrichments.append(virustotal_enrichment)

    return enrichments