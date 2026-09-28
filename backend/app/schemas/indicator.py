from datetime import datetime
import email.utils
import ipaddress
import re
from urllib.parse import urlparse

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from backend.app.models.indicator import IndicatorStatus, IndicatorType, TLP


class IndicatorInput(BaseModel):
    indicator_type: IndicatorType
    value: str = Field(min_length=1, max_length=500)
    confidence: int = Field(default=0, ge=0, le=100)
    tlp: TLP = TLP.CLEAR
    status: IndicatorStatus = IndicatorStatus.ACTIVE
    tags: list[str] = Field(default_factory=list, max_length=50)
    attack_techniques: list[str] = Field(default_factory=list, max_length=50)
    notes: str | None = Field(default=None, max_length=5000)
    ttl_days: int | None = Field(default=30, ge=1, le=3650)

    @field_validator("indicator_type", mode="before")
    @classmethod
    def normalize_indicator_type(cls, value):
        return value.strip().lower() if isinstance(value, str) else value

    @field_validator("value", mode="before")
    @classmethod
    def normalize_indicator_value(cls, value):
        return value.strip().lower() if isinstance(value, str) else value

    @field_validator("tags", "attack_techniques")
    @classmethod
    def normalize_lists(cls, value: list[str]):
        seen = set()
        cleaned = []
        for item in value:
            item = item.strip()
            if item and item.lower() not in seen:
                seen.add(item.lower())
                cleaned.append(item)
        return cleaned

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

        elif self.indicator_type == IndicatorType.EMAIL:
            parsed = email.utils.parseaddr(value)
            if not parsed[1] or "@" not in parsed[1]:
                raise ValueError("Value is not a valid email address")

        elif self.indicator_type == IndicatorType.CVE:
            if not re.fullmatch(r"cve-\d{4}-\d{4,7}", value, re.IGNORECASE):
                raise ValueError("CVE must match CVE-YYYY-NNNN")

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
    confidence: int
    tlp: TLP | str
    status: IndicatorStatus | str
    tags: list[str]
    attack_techniques: list[str]
    notes: str | None
    first_seen: datetime
    last_seen: datetime
    created_at: datetime
    updated_at: datetime
    ttl_days: int | None


class IndicatorSearchResponse(BaseModel):
    total: int
    page: int
    size: int
    items: list[IndicatorResponse]
