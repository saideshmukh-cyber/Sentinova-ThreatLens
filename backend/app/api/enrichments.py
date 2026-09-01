from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.db.database import SessionLocal
from backend.app.schemas.enrichment import EnrichmentResponse
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
def list_indicator_enrichments(
    indicator_id: int,
    db: Session = Depends(get_db),
):
    return enrichment_service.get_enrichments_for_indicator(
        db,
        indicator_id,
    )