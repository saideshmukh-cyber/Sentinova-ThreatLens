from pydantic import BaseModel

from backend.app.schemas.indicator import IndicatorType
from backend.app.schemas.enrichment import EnrichmentResponse

class InvestigationCreate(BaseModel):
    indicator_type: IndicatorType
    value: str

class InvestigationResponse(BaseModel):
    indicator_id: int
    indicator_type: str
    value: str
    enrichments: list[EnrichmentResponse]