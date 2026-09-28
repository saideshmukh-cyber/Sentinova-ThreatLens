from pydantic import BaseModel, Field


class FeedConfigUpdate(BaseModel):
    enabled: bool | None = None
    schedule_minutes: int | None = Field(default=None, ge=15, le=10080)
