from pydantic import BaseModel, field_validator

from backend.app.schemas.indicator import IndicatorType
from backend.app.schemas.enrichment import EnrichmentResponse


class InvestigationCreate(BaseModel):
    indicator_type: IndicatorType
    value: str

    @field_validator("indicator_type", mode="before")
    @classmethod
    def normalize_indicator_type(cls, value):
        if isinstance(value, str):
            return value.strip().lower()

        return value

    @field_validator("value", mode="before")
    @classmethod
    def normalize_indicator_value(cls, value):
        if isinstance(value, str):
            return value.strip().lower()

        return value


class InvestigationResponse(BaseModel):
    indicator_id: int
    indicator_type: str
    value: str
    enrichments: list[EnrichmentResponse]