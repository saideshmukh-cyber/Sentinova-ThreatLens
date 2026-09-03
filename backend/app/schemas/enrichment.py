from datetime import datetime

from pydantic import BaseModel, ConfigDict


class EnrichmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    indicator_id: int
    source: str
    data: dict
    created_at: datetime