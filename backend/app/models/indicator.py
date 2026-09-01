from datetime import datetime
from enum import Enum

from sqlalchemy import DateTime, Enum as SQLEnum, Text
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.db.database import Base


class IndicatorType(str, Enum):
    IP = "ip"
    DOMAIN = "domain"
    URL = "url"
    HASH = "hash"


class Indicator(Base):
    __tablename__ = "indicators"

    id: Mapped[int] = mapped_column(primary_key=True)

    indicator_type: Mapped[IndicatorType] = mapped_column(
        SQLEnum(
            IndicatorType,
            values_callable=lambda enum_class: [
                member.value for member in enum_class
            ],
            name="indicatortype",
        ),
        nullable=False,
    )

    value: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        unique=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )