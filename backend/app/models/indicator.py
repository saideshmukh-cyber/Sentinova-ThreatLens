from datetime import datetime
from enum import Enum

from sqlalchemy import DateTime, Enum as SQLEnum, JSON, SmallInteger, Text, String
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.db.database import Base


class IndicatorType(str, Enum):
    IP = "ip"
    DOMAIN = "domain"
    URL = "url"
    HASH = "hash"
    EMAIL = "email"
    CVE = "cve"


class IndicatorStatus(str, Enum):
    ACTIVE = "active"
    EXPIRED = "expired"
    WHITELISTED = "whitelisted"
    UNDER_REVIEW = "under_review"


class TLP(str, Enum):
    CLEAR = "clear"
    GREEN = "green"
    AMBER = "amber"
    RED = "red"


class Indicator(Base):
    __tablename__ = "indicators"

    id: Mapped[int] = mapped_column(primary_key=True)

    indicator_type: Mapped[IndicatorType] = mapped_column(
        SQLEnum(
            IndicatorType,
            values_callable=lambda enum_class: [member.value for member in enum_class],
            name="indicatortype",
        ),
        nullable=False,
    )

    value: Mapped[str] = mapped_column(Text, nullable=False, unique=True)

    severity_score: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=0)

    confidence: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=0)
    tlp: Mapped[str] = mapped_column(String(20), nullable=False, default=TLP.CLEAR.value)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default=IndicatorStatus.ACTIVE.value)
    tags: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    attack_techniques: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    ttl_days: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)

    first_seen: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    last_seen: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
