from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.db.database import SessionLocal
from backend.app.models.indicator import Indicator
from backend.app.schemas.enrichment import (
    EnrichmentResponse,
)
from backend.app.services import enrichment_service


router = APIRouter(
    prefix="/api/v1/enrichments",
    tags=["Enrichments"],
)


def get_db():
    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


@router.get(
    "/indicator/{indicator_id}",
    response_model=list[EnrichmentResponse],
)
def get_indicator_enrichments(
    indicator_id: int,
    db: Session = Depends(get_db),
):
    indicator = (
        db.query(Indicator)
        .filter(
            Indicator.id == indicator_id
        )
        .first()
    )

    if indicator is None:
        raise HTTPException(
            status_code=404,
            detail="Indicator not found",
        )

    return (
        enrichment_service
        .get_enrichments_for_indicator(
            db,
            indicator_id,
        )
    )


@router.post(
    "/{indicator_id}/dns",
    response_model=EnrichmentResponse,
)
def enrich_dns(
    indicator_id: int,
    db: Session = Depends(get_db),
):
    indicator = (
        db.query(Indicator)
        .filter(
            Indicator.id == indicator_id
        )
        .first()
    )

    if indicator is None:
        raise HTTPException(
            status_code=404,
            detail="Indicator not found",
        )

    if indicator.indicator_type.value != "domain":
        raise HTTPException(
            status_code=400,
            detail="DNS enrichment requires a domain indicator",
        )

    return enrichment_service.enrich_domain(
        db=db,
        indicator_id=indicator.id,
        domain=indicator.value,
    )


@router.post(
    "/{indicator_id}/ip",
    response_model=EnrichmentResponse,
)
def enrich_ip(
    indicator_id: int,
    db: Session = Depends(get_db),
):
    indicator = (
        db.query(Indicator)
        .filter(
            Indicator.id == indicator_id
        )
        .first()
    )

    if indicator is None:
        raise HTTPException(
            status_code=404,
            detail="Indicator not found",
        )

    if indicator.indicator_type.value != "ip":
        raise HTTPException(
            status_code=400,
            detail="IP enrichment requires an IP indicator",
        )

    return enrichment_service.enrich_ip(
        db=db,
        indicator_id=indicator.id,
        ip=indicator.value,
    )


@router.post(
    "/{indicator_id}/hash",
    response_model=EnrichmentResponse,
)
def enrich_hash(
    indicator_id: int,
    db: Session = Depends(get_db),
):
    indicator = (
        db.query(Indicator)
        .filter(
            Indicator.id == indicator_id
        )
        .first()
    )

    if indicator is None:
        raise HTTPException(
            status_code=404,
            detail="Indicator not found",
        )

    if indicator.indicator_type.value != "hash":
        raise HTTPException(
            status_code=400,
            detail="Hash enrichment requires a hash indicator",
        )

    return enrichment_service.enrich_hash(
        db=db,
        indicator_id=indicator.id,
        value=indicator.value,
    )


@router.post(
    "/{indicator_id}/virustotal",
    response_model=EnrichmentResponse,
)
def enrich_virustotal(
    indicator_id: int,
    db: Session = Depends(get_db),
):
    indicator = (
        db.query(Indicator)
        .filter(
            Indicator.id == indicator_id
        )
        .first()
    )

    if indicator is None:
        raise HTTPException(
            status_code=404,
            detail="Indicator not found",
        )

    return enrichment_service.enrich_virustotal(
        db=db,
        indicator_id=indicator.id,
        indicator_type=(
            indicator.indicator_type.value
        ),
        value=indicator.value,
    )