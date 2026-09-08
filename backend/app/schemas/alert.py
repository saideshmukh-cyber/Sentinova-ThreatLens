from datetime import datetime

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
)

from backend.app.models.alert import AlertStatus


class AlertResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
    )

    id: int
    indicator_id: int
    severity_score: int
    rule: str
    status: AlertStatus
    assignee: str | None
    created_at: datetime
    updated_at: datetime


class AlertUpdate(BaseModel):
    status: AlertStatus | None = None

    assignee: str | None = Field(
        default=None,
        max_length=200,
    )