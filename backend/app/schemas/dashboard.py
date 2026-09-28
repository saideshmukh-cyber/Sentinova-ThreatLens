from pydantic import BaseModel, Field


class DashboardLayout(BaseModel):
    visible: dict[str, bool] = Field(default_factory=dict)
