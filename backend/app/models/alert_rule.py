from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Integer,
    Text,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
)

from backend.app.db.database import Base


class AlertRule(Base):
    __tablename__ = "alert_rules"

    id: Mapped[int] = mapped_column(
        primary_key=True,
    )

    name: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        unique=True,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    enabled: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    min_score: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    source: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    category: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    threshold: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1,
    )

    window_minutes: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=5,
    )

    route_to: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )