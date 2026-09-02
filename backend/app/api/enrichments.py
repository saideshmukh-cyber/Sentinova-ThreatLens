from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.db.database import SessionLocal
from backend.app.schemas.enrichment import EnrichmentResponse
from backend.app.services import enrichment_service
from backend.app.models.indicator import Indicator

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
def list_indicator_enrichments(
    indicator_id: int,
    db: Session = Depends(get_db),
):
    return enrichment_service.get_enrichments_for_indicator(
        db,
        indicator_id,
    )

@router.post(
    "/indicator/{indicator_id}/dns",
    response_model=EnrichmentResponse,
)
def enrich_indicator_dns(
    indicator_id: int,
    db: Session = Depends(get_db),
):
    indicator = db.query(Indicator).filter(
        Indicator.id == indicator_id
    ).first()

    if indicator is None:
        from fastapi import HTTPException

        raise HTTPException(
            status_code=404,
            detail="Indicator not found",
        )

    if indicator.indicator_type.value != "domain":
        from fastapi import HTTPException

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
    "/indicator/{indicator_id}/ip",
    response_model=EnrichmentResponse,
)
def enrich_indicator_ip(
    indicator_id: int,
    db: Session = Depends(get_db),
):
    indicator = db.query(Indicator).filter(
        Indicator.id == indicator_id
    ).first()

    if indicator is None:
        from fastapi import HTTPException

        raise HTTPException(
            status_code=404,
            detail="Indicator not found",
        )

    if indicator.indicator_type.value != "ip":
        from fastapi import HTTPException

        raise HTTPException(
            status_code=400,
            detail="IP enrichment requires an IP indicator",
        )

    return enrichment_service.enrich_ip(
        db=db,
        indicator_id=indicator.id,
        ip=indicator.value,
    )