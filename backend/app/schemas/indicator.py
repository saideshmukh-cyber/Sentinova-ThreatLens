from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator

from backend.app.models.indicator import IndicatorType


class IndicatorCreate(BaseModel):
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


class IndicatorUpdate(BaseModel):
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


class IndicatorResponse(BaseModel):
    id: int
    indicator_type: IndicatorType
    value: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)