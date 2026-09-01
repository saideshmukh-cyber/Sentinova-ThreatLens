from datetime import datetime

from pydantic import BaseModel, ConfigDict

from backend.app.models.indicator import IndicatorType


class IndicatorCreate(BaseModel):
    indicator_type: IndicatorType
    value: str


class IndicatorUpdate(BaseModel):
    indicator_type: IndicatorType
    value: str


class IndicatorResponse(BaseModel):
    id: int
    indicator_type: IndicatorType
    value: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)