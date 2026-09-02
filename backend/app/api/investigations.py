from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.db.database import SessionLocal
from backend.app.schemas.investigation import (
    InvestigationCreate,
    InvestigationResponse,
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
    indicator = investigation_service.get_or_create_indicator(
        db=db,
        indicator_type=request.indicator_type,
        value=request.value,
    )

    return {
        "indicator_id": indicator.id,
        "indicator_type": indicator.indicator_type.value,
        "value": indicator.value,
        "enrichments": investigation_service.get_enrichments(
    db=db,
    indicator_id=indicator.id,
),
    }