from datetime import datetime
from enum import Enum

from sqlalchemy import (
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    Integer,
    Text,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
)

from backend.app.db.database import Base


class AlertStatus(str, Enum):
    NEW = "new"
    ACKNOWLEDGED = "acknowledged"
    IN_PROGRESS = "in-progress"
    RESOLVED = "resolved"
    CLOSED = "closed"


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[int] = mapped_column(
        primary_key=True,
    )

    indicator_id: Mapped[int] = mapped_column(
        ForeignKey("indicators.id"),
        nullable=False,
    )

    severity_score: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    rule: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    status: Mapped[AlertStatus] = mapped_column(
        SQLEnum(
            AlertStatus,
            values_callable=lambda enum_class: [
                member.value
                for member in enum_class
            ],
            name="alertstatus",
        ),
        nullable=False,
        default=AlertStatus.NEW,
    )

    assignee: Mapped[str | None] = mapped_column(
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