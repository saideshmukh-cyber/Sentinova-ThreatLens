from sqlalchemy.orm import Session

from backend.app.models.enrichment import IndicatorEnrichment
from backend.app.models.indicator import Indicator
from backend.app.models.investigation import Investigation
from backend.app.services import enrichment_service
from backend.app.services.scoring_service import (
    calculate_investigation_risk,
)
from backend.app.services.indicator_normalizer import (
    normalize_indicator,
)


def create_indicator(
    db: Session,
    indicator_type,
    value: str,
):
    normalized_type = (
        indicator_type.value
        if hasattr(
            indicator_type,
            "value",
        )
        else str(
            indicator_type
        ).strip().lower()
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
    normalized_type = (
        indicator_type.value
        if hasattr(
            indicator_type,
            "value",
        )
        else str(
            indicator_type
        ).strip().lower()
    )

    normalized_value = normalize_indicator(
        normalized_type,
        value,
    )

    existing = (
        db.query(Indicator)
        .filter(
            Indicator.indicator_type
            == normalized_type,
            Indicator.value
            == normalized_value,
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


def create_investigation(
    db: Session,
    indicator_id: int,
):
    investigation = Investigation(
        indicator_id=indicator_id,
    )

    db.add(investigation)
    db.commit()
    db.refresh(investigation)

    return investigation


def get_enrichments(
    db: Session,
    indicator_id: int,
):
    return (
        db.query(IndicatorEnrichment)
        .filter(
            IndicatorEnrichment.indicator_id
            == indicator_id,
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
    indicator_type = (
        indicator.indicator_type.value
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
    return enrichment_service.enrich_virustotal(
        db=db,
        indicator_id=indicator.id,
        indicator_type=(
            indicator.indicator_type.value
        ),
        value=indicator.value,
    )


def update_investigation_score(
    db: Session,
    investigation,
    enrichments: list,
):
    score, risk_level = (
        calculate_investigation_risk(
            enrichments
        )
    )

    investigation.score = score
    investigation.risk_level = risk_level

    db.commit()
    db.refresh(investigation)

    return investigation


def investigate_indicator(
    db: Session,
    indicator,
    include_virustotal: bool = True,
):
    investigation = create_investigation(
        db=db,
        indicator_id=indicator.id,
    )

    enrichments = []

    local_enrichment = run_local_enrichment(
        db=db,
        indicator=indicator,
    )

    if local_enrichment is not None:
        enrichments.append(
            local_enrichment
        )

    if include_virustotal:
        virustotal_enrichment = (
            run_virustotal_enrichment(
                db=db,
                indicator=indicator,
            )
        )

        if virustotal_enrichment is not None:
            enrichments.append(
                virustotal_enrichment
            )

    investigation = (
        update_investigation_score(
            db=db,
            investigation=investigation,
            enrichments=enrichments,
        )
    )

    return investigation, enrichments


def get_investigation(
    db: Session,
    investigation_id: int,
):
    return (
        db.query(Investigation)
        .filter(
            Investigation.id
            == investigation_id,
        )
        .first()
    )


def get_all_investigations(
    db: Session,
):
    return (
        db.query(Investigation)
        .order_by(
            Investigation.created_at.desc()
        )
        .all()
    )


def get_indicator_for_investigation(
    db: Session,
    investigation,
):
    return (
        db.query(Indicator)
        .filter(
            Indicator.id
            == investigation.indicator_id,
        )
        .first()
    )