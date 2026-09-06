from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field, field_validator


class IndicatorType(str, Enum):
    ip = "ip"
    domain = "domain"
    url = "url"
    hash = "hash"


class IndicatorCreate(BaseModel):
    indicator_type: IndicatorType
    value: str = Field(
        min_length=1,
        max_length=500,
    )

    @field_validator(
        "value",
        mode="before",
    )
    @classmethod
    def normalize_value(
        cls,
        value,
    ):
        if isinstance(value, str):
            return value.strip().lower()

        return value


class IndicatorResponse(BaseModel):
    id: int
    indicator_type: IndicatorType
    value: str
    created_at: datetime

    model_config = {
        "from_attributes": True
    }


class IndicatorSearchResponse(BaseModel):
    total: int
    page: int
    size: int
    items: list[IndicatorResponse]