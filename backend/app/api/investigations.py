from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.config import settings
from backend.app.db.database import SessionLocal
from backend.app.schemas.investigation import (
    InvestigationCreate,
    InvestigationHistoryResponse,
    InvestigationResponse,
    InvestigationSummary,
)
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
def investigate(
    request: InvestigationCreate,
    db: Session = Depends(get_db),
):
    indicator = (
        investigation_service.get_or_create_indicator(
            db=db,
            indicator_type=request.indicator_type,
            value=request.value,
        )
    )

    include_virustotal = bool(
        settings.virustotal_api_key
    )

    investigation, enrichments = (
        investigation_service.investigate_indicator(
            db=db,
            indicator=indicator,
            include_virustotal=include_virustotal,
        )
    )

    sources = [
        enrichment.source
        for enrichment in enrichments
    ]

    summary = InvestigationSummary(
        score=investigation.score,
        risk_level=investigation.risk_level,
        enrichment_count=len(
            enrichments
        ),
        sources=sources,
    )

    return {
        "investigation_id": investigation.id,
        "indicator_id": indicator.id,
        "indicator_type": (
            indicator.indicator_type.value
        ),
        "value": indicator.value,
        "score": investigation.score,
        "risk_level": investigation.risk_level,
        "summary": summary,
        "enrichments": enrichments,
    }


@router.get(
    "/",
    response_model=list[
        InvestigationHistoryResponse
    ],
)
def list_investigations(
    db: Session = Depends(get_db),
):
    investigations = (
        investigation_service.get_all_investigations(
            db
        )
    )

    results = []

    for investigation in investigations:
        indicator = (
            investigation_service
            .get_indicator_for_investigation(
                db,
                investigation,
            )
        )

        if indicator is None:
            continue

        results.append(
            {
                "investigation_id": (
                    investigation.id
                ),
                "indicator_id": (
                    investigation.indicator_id
                ),
                "indicator_type": (
                    indicator.indicator_type.value
                ),
                "value": indicator.value,
                "score": investigation.score,
                "risk_level": (
                    investigation.risk_level
                ),
                "created_at": (
                    investigation.created_at
                ),
            }
        )

    return results


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
        investigation_service.get_enrichments(
            db,
            indicator.id,
        )
    )

    sources = [
        enrichment.source
        for enrichment in enrichments
    ]

    summary = InvestigationSummary(
        score=investigation.score,
        risk_level=investigation.risk_level,
        enrichment_count=len(
            enrichments
        ),
        sources=sources,
    )

    return {
        "investigation_id": investigation.id,
        "indicator_id": indicator.id,
        "indicator_type": (
            indicator.indicator_type.value
        ),
        "value": indicator.value,
        "score": investigation.score,
        "risk_level": investigation.risk_level,
        "summary": summary,
        "enrichments": enrichments,
    }