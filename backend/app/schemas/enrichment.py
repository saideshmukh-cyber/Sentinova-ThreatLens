from datetime import datetime

from pydantic import BaseModel, ConfigDict


class EnrichmentResponse(BaseModel):
    id: int
    indicator_id: int
    source: str
    data: dict
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)