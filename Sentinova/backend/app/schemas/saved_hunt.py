from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class SavedHuntCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    query: str = Field(min_length=1, max_length=500)
    indicator_type: str | None = Field(default=None, max_length=50)


class SavedHuntResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int | None
    name: str
    query: str
    indicator_type: str | None
    created_at: datetime
    updated_at: datetime
