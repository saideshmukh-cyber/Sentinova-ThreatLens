from datetime import datetime

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
)


class SecurityEventCreate(BaseModel):
    source: str = Field(
        min_length=1,
        max_length=200,
    )

    event_type: str = Field(
        min_length=1,
        max_length=200,
    )

    category: str | None = Field(
        default=None,
        max_length=200,
    )

    indicator_value: str = Field(
        min_length=1,
        max_length=500,
    )

    timestamp: datetime


class SecurityEventResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
    )

    id: int
    source: str
    event_type: str
    category: str | None
    indicator_value: str
    timestamp: datetime
    created_at: datetime