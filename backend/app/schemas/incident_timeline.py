from datetime import datetime

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
)


class IncidentTimelineCreate(BaseModel):
    event_type: str = Field(
        min_length=1,
        max_length=100,
    )

    description: str = Field(
        min_length=1,
        max_length=2000,
    )

    actor: str | None = Field(
        default=None,
        max_length=200,
    )


class IncidentTimelineResponse(BaseModel):
    id: int
    incident_id: int
    event_type: str
    description: str
    actor: str | None
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )