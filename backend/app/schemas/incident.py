from datetime import datetime

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
)

from backend.app.models.incident import (
    IncidentSeverity,
    IncidentStatus,
)


class IncidentCreate(BaseModel):
    title: str = Field(
        min_length=1,
        max_length=300,
    )

    description: str | None = Field(
        default=None,
        max_length=2000,
    )

    severity: IncidentSeverity = (
        IncidentSeverity.MEDIUM
    )

    assignee: str | None = Field(
        default=None,
        max_length=200,
    )


class IncidentUpdate(BaseModel):
    title: str | None = Field(
        default=None,
        min_length=1,
        max_length=300,
    )

    description: str | None = Field(
        default=None,
        max_length=2000,
    )

    severity: IncidentSeverity | None = None

    status: IncidentStatus | None = None

    assignee: str | None = Field(
        default=None,
        max_length=200,
    )


class IncidentResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
    )

    id: int
    title: str
    description: str | None
    severity: IncidentSeverity
    status: IncidentStatus
    assignee: str | None
    created_at: datetime
    updated_at: datetime