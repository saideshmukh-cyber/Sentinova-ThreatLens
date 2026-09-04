from sqlalchemy.orm import Session

from backend.app.models.enrichment import (
    IndicatorEnrichment,
)
from backend.app.models.indicator import Indicator
from backend.app.models.investigation import (
    Investigation,
)
from backend.app.services.scoring_service import (
    calculate_investigation_breakdown,
    calculate_investigation_risk,
    calculate_investigation_score,
)


def create_investigation(
    db: Session,
    indicator_id: int,
):
    investigation = Investigation(
        indicator_id=indicator_id,
        score=0,
        risk_level="LOW",
    )

    db.add(investigation)
    db.commit()
    db.refresh(investigation)

    return investigation


def update_investigation_score(
    db: Session,
    investigation: Investigation,
):
    enrichments = (
        db.query(IndicatorEnrichment)
        .filter(
            IndicatorEnrichment.indicator_id
            == investigation.indicator_id
        )
        .all()
    )

    enrichment_data = [
        enrichment.data
        for enrichment in enrichments
    ]

    score = calculate_investigation_score(
        enrichment_data
    )

    risk_level = calculate_investigation_risk(
        score
    )

    investigation.score = score
    investigation.risk_level = risk_level

    db.commit()
    db.refresh(investigation)

    return investigation


def get_investigation(
    db: Session,
    investigation_id: int,
):
    return (
        db.query(Investigation)
        .filter(
            Investigation.id == investigation_id
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
    investigation: Investigation,
):
    return (
        db.query(Indicator)
        .filter(
            Indicator.id
            == investigation.indicator_id
        )
        .first()
    )


def get_enrichments_for_investigation(
    db: Session,
    investigation: Investigation,
):
    return (
        db.query(IndicatorEnrichment)
        .filter(
            IndicatorEnrichment.indicator_id
            == investigation.indicator_id
        )
        .all()
    )


def get_investigation_breakdown(
    db: Session,
    investigation: Investigation,
):
    enrichments = (
        get_enrichments_for_investigation(
            db,
            investigation,
        )
    )

    enrichment_data = [
        enrichment.data
        for enrichment in enrichments
    ]

    return calculate_investigation_breakdown(
        enrichment_data
    )