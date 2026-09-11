from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
)
from sqlalchemy.orm import Session

from backend.app.db.database import SessionLocal
from backend.app.models.indicator import Indicator
from backend.app.schemas.investigation import (
    InvestigationCreate,
    InvestigationHistoryResponse,
    InvestigationResponse,
    InvestigationSummary,
)
from backend.app.services import enrichment_service
from backend.app.services import investigation_service


router = APIRouter(
    prefix="/api/v1/investigations",
    tags=["Investigations"],
)


def get_db():
    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


@router.post(
    "/",
    response_model=InvestigationResponse,
)
def create_investigation(
    investigation_data: InvestigationCreate,
    db: Session = Depends(get_db),
):
    indicator = (
        db.query(Indicator)
        .filter(
            Indicator.value
            == investigation_data.value
        )
        .first()
    )

    if indicator is None:
        raise HTTPException(
            status_code=404,
            detail="Indicator not found",
        )

    if (
        indicator.indicator_type.value
        != investigation_data.indicator_type.value
    ):
        raise HTTPException(
            status_code=400,
            detail="Indicator type does not match",
        )

    investigation = (
        investigation_service.create_investigation(
            db,
            indicator.id,
        )
    )

    enrichment_service.enrich_indicator(
        db=db,
        indicator=indicator,
    )

    investigation_service.update_investigation_score(
        db,
        investigation,
    )

    enrichments = (
        investigation_service
        .get_enrichments_for_investigation(
            db,
            investigation,
        )
    )

    breakdown = (
        investigation_service
        .get_investigation_breakdown(
            db,
            investigation,
        )
    )

    sources = list(
        {
            enrichment.source
            for enrichment in enrichments
        }
    )

    summary = InvestigationSummary(
        score=investigation.score,
        risk_level=investigation.risk_level,
        enrichment_count=len(enrichments),
        sources=sources,
        score_breakdown=breakdown,
    )

    return InvestigationResponse(
        investigation_id=investigation.id,
        indicator_id=indicator.id,
        indicator_type=indicator.indicator_type.value,
        value=indicator.value,
        score=investigation.score,
        risk_level=investigation.risk_level,
        summary=summary,
        enrichments=enrichments,
    )


@router.get(
    "/",
    response_model=list[InvestigationHistoryResponse],
)
def get_investigations(
    page: int = Query(
        default=1,
        ge=1,
    ),
    size: int = Query(
        default=25,
        ge=1,
        le=100,
    ),
    db: Session = Depends(get_db),
):
    investigation_rows = (
        investigation_service
        .get_all_investigations(
            db=db,
            page=page,
            size=size,
        )
    )

    results = []

    for investigation, indicator in investigation_rows:
        results.append(
            InvestigationHistoryResponse(
                investigation_id=investigation.id,
                indicator_id=indicator.id,
                indicator_type=(
                    indicator.indicator_type.value
                ),
                value=indicator.value,
                score=investigation.score,
                risk_level=investigation.risk_level,
                created_at=investigation.created_at,
            )
        )

    return results


@router.post(
    "/admin/create-for-existing-indicators",
)
def create_for_existing_indicators(
    db: Session = Depends(get_db),
):
    investigations = (
        investigation_service
        .create_investigations_for_all_indicators(
            db
        )
    )

    return {
        "created_or_existing": len(
            investigations
        ),
        "message": (
            "Investigations created for existing indicators"
        ),
    }


@router.get(
    "/{investigation_id}",
    response_model=InvestigationResponse,
)
def get_investigation(
    investigation_id: int,
    db: Session = Depends(get_db),
):
    investigation = (
        investigation_service.get_investigation(
            db,
            investigation_id,
        )
    )

    if investigation is None:
        raise HTTPException(
            status_code=404,
            detail="Investigation not found",
        )

    indicator = (
        investigation_service
        .get_indicator_for_investigation(
            db,
            investigation,
        )
    )

    if indicator is None:
        raise HTTPException(
            status_code=404,
            detail="Indicator not found",
        )

    enrichments = (
        investigation_service
        .get_enrichments_for_investigation(
            db,
            investigation,
        )
    )

    breakdown = (
        investigation_service
        .get_investigation_breakdown(
            db,
            investigation,
        )
    )

    sources = list(
        {
            enrichment.source
            for enrichment in enrichments
        }
    )

    summary = InvestigationSummary(
        score=investigation.score,
        risk_level=investigation.risk_level,
        enrichment_count=len(enrichments),
        sources=sources,
        score_breakdown=breakdown,
    )

    return InvestigationResponse(
        investigation_id=investigation.id,
        indicator_id=indicator.id,
        indicator_type=indicator.indicator_type.value,
        value=indicator.value,
        score=investigation.score,
        risk_level=investigation.risk_level,
        summary=summary,
        enrichments=enrichments,
    )