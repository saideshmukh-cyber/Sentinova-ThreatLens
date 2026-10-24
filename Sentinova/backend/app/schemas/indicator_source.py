from datetime import datetime

from pydantic import (
    BaseModel,
    ConfigDict,
)


class IndicatorSourceResponse(BaseModel):
    id: int
    indicator_id: int
    source: str
    confidence: int
    first_seen: datetime
    last_seen: datetime

    model_config = ConfigDict(
        from_attributes=True
    )