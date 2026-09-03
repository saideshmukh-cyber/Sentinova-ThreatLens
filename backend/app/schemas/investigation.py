from datetime import datetime

from pydantic import BaseModel, field_validator

from backend.app.schemas.enrichment import EnrichmentResponse
from backend.app.schemas.indicator import IndicatorType


class InvestigationCreate(BaseModel):
    indicator_type: IndicatorType
    value: str

    @field_validator(
        "indicator_type",
        mode="before",
    )
    @classmethod
    def normalize_indicator_type(
        cls,
        value,
    ):
        if isinstance(
            value,
            str,
        ):
            return value.strip().lower()

        return value

    @field_validator(
        "value",
        mode="before",
    )
    @classmethod
    def normalize_indicator_value(
        cls,
        value,
    ):
        if isinstance(
            value,
            str,
        ):
            return value.strip().lower()

        return value


class InvestigationSummary(BaseModel):
    score: int
    risk_level: str
    enrichment_count: int
    sources: list[str]


class InvestigationResponse(BaseModel):
    investigation_id: int
    indicator_id: int
    indicator_type: str
    value: str
    score: int
    risk_level: str
    summary: InvestigationSummary
    enrichments: list[EnrichmentResponse]


class InvestigationHistoryResponse(BaseModel):
    investigation_id: int
    indicator_id: int
    indicator_type: str
    value: str
    score: int
    risk_level: str
    created_at: datetime