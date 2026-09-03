import ipaddress
import re
from datetime import datetime
from urllib.parse import urlparse

from pydantic import (
    BaseModel,
    ConfigDict,
    field_validator,
    model_validator,
)

from backend.app.models.indicator import IndicatorType


class IndicatorCreate(BaseModel):
    indicator_type: IndicatorType
    value: str

    @field_validator(
        "indicator_type",
        mode="before",
    )
    @classmethod
    def normalize_indicator_type(cls, value):
        if isinstance(value, str):
            return value.strip().lower()

        return value

    @field_validator(
        "value",
        mode="before",
    )
    @classmethod
    def normalize_indicator_value(cls, value):
        if isinstance(value, str):
            return value.strip().lower()

        return value

    @field_validator("value")
    @classmethod
    def validate_value(
        cls,
        value: str,
    ) -> str:
        value = value.strip()

        if not value:
            raise ValueError(
                "Indicator value cannot be empty"
            )

        return value

    @model_validator(mode="after")
    def validate_indicator(self):
        if self.indicator_type.value == "ip":
            try:
                ipaddress.ip_address(
                    self.value
                )
            except ValueError:
                raise ValueError(
                    "Value is not a valid IP address"
                )

        if self.indicator_type.value == "domain":
            domain_pattern = (
                r"^(?=.{1,253}$)"
                r"([a-zA-Z0-9-]+\.)+"
                r"[a-zA-Z]{2,}$"
            )

            if not re.match(
                domain_pattern,
                self.value,
            ):
                raise ValueError(
                    "Value is not a valid domain"
                )

        if self.indicator_type.value == "url":
            parsed = urlparse(
                self.value
            )

            if parsed.scheme not in {
                "http",
                "https",
            }:
                raise ValueError(
                    "URL must use HTTP or HTTPS"
                )

            if not parsed.hostname:
                raise ValueError(
                    "URL must contain a valid hostname"
                )

        return self


class IndicatorUpdate(BaseModel):
    indicator_type: IndicatorType
    value: str

    @field_validator(
        "indicator_type",
        mode="before",
    )
    @classmethod
    def normalize_indicator_type(cls, value):
        if isinstance(value, str):
            return value.strip().lower()

        return value

    @field_validator(
        "value",
        mode="before",
    )
    @classmethod
    def normalize_indicator_value(cls, value):
        if isinstance(value, str):
            return value.strip().lower()

        return value


class IndicatorResponse(BaseModel):
    id: int
    indicator_type: IndicatorType
    value: str
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )