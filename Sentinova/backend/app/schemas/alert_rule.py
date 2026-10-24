from datetime import datetime

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
)


class AlertRuleCreate(BaseModel):
    name: str = Field(
        min_length=1,
        max_length=200,
    )

    description: str | None = Field(
        default=None,
        max_length=1000,
    )

    enabled: bool = True

    min_score: int | None = Field(
        default=None,
        ge=0,
        le=100,
    )

    source: str | None = Field(
        default=None,
        max_length=200,
    )

    category: str | None = Field(
        default=None,
        max_length=200,
    )

    threshold: int = Field(
        default=1,
        ge=1,
    )

    window_minutes: int = Field(
        default=5,
        ge=1,
    )

    route_to: str | None = Field(
        default=None,
        max_length=200,
    )


class AlertRuleUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=1,
        max_length=200,
    )

    description: str | None = Field(
        default=None,
        max_length=1000,
    )

    enabled: bool | None = None

    min_score: int | None = Field(
        default=None,
        ge=0,
        le=100,
    )

    source: str | None = Field(
        default=None,
        max_length=200,
    )

    category: str | None = Field(
        default=None,
        max_length=200,
    )

    threshold: int | None = Field(
        default=None,
        ge=1,
    )

    window_minutes: int | None = Field(
        default=None,
        ge=1,
    )

    route_to: str | None = Field(
        default=None,
        max_length=200,
    )


class AlertRuleResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
    )

    id: int
    name: str
    description: str | None
    enabled: bool
    min_score: int | None
    source: str | None
    category: str | None
    threshold: int
    window_minutes: int
    route_to: str | None
    created_at: datetime
    updated_at: datetime