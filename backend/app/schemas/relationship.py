from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class IndicatorRelationshipCreate(BaseModel):
    target_indicator_id: int
    relationship_type: str = Field(min_length=1, max_length=100)


class IndicatorRelationshipResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    source_indicator_id: int
    target_indicator_id: int
    relationship_type: str
    created_at: datetime
    source_value: str | None = None
    target_value: str | None = None
    source_type: str | None = None
    target_type: str | None = None
