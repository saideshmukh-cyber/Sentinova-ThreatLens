from datetime import datetime
import ipaddress
import re
from urllib.parse import urlparse

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from backend.app.models.indicator import IndicatorType


class IndicatorInput(BaseModel):
    indicator_type: IndicatorType
    value: str = Field(min_length=1, max_length=500)

    @field_validator("indicator_type", mode="before")
    @classmethod
    def normalize_indicator_type(cls, value):
        return value.strip().lower() if isinstance(value, str) else value

    @field_validator("value", mode="before")
    @classmethod
    def normalize_indicator_value(cls, value):
        return value.strip().lower() if isinstance(value, str) else value

    @model_validator(mode="after")
    def validate_indicator(self):
        value = self.value.strip()

        if self.indicator_type == IndicatorType.IP:
            try:
                ipaddress.ip_address(value)
            except ValueError as exc:
                raise ValueError("Value is not a valid IP address") from exc

        elif self.indicator_type == IndicatorType.DOMAIN:
            domain_pattern = r"^(?=.{1,253}$)([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$"
            if not re.match(domain_pattern, value):
                raise ValueError("Value is not a valid domain")

        elif self.indicator_type == IndicatorType.URL:
            parsed = urlparse(value)
            if parsed.scheme not in {"http", "https"} or not parsed.hostname:
                raise ValueError("URL must use HTTP or HTTPS and contain a valid hostname")

        elif self.indicator_type == IndicatorType.HASH:
            if len(value) not in {32, 40, 64} or not re.fullmatch(r"[0-9a-fA-F]+", value):
                raise ValueError("Hash must be a valid MD5, SHA1, or SHA256 hexadecimal value")

        self.value = value
        return self


class IndicatorCreate(IndicatorInput):
    pass


class IndicatorUpdate(IndicatorInput):
    pass


class IndicatorResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    indicator_type: IndicatorType
    value: str
    severity_score: int
    created_at: datetime


class IndicatorSearchResponse(BaseModel):
    total: int
    page: int
    size: int
    items: list[IndicatorResponse]
