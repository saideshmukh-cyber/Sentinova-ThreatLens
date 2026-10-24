from datetime import datetime
from enum import Enum

from sqlalchemy import (
    DateTime,
    Enum as SQLEnum,
    Integer,
    Text,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
)

from backend.app.db.database import Base


class IncidentStatus(str, Enum):
    OPEN = "open"
    IN_PROGRESS = "in-progress"
    RESOLVED = "resolved"
    CLOSED = "closed"


class IncidentSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Incident(Base):
    __tablename__ = "incidents"

    id: Mapped[int] = mapped_column(
        primary_key=True,
    )

    title: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    severity: Mapped[IncidentSeverity] = mapped_column(
        SQLEnum(
            IncidentSeverity,
            values_callable=lambda enum_class: [
                member.value
                for member in enum_class
            ],
            name="incidentseverity",
        ),
        nullable=False,
        default=IncidentSeverity.MEDIUM,
    )

    status: Mapped[IncidentStatus] = mapped_column(
        SQLEnum(
            IncidentStatus,
            values_callable=lambda enum_class: [
                member.value
                for member in enum_class
            ],
            name="incidentstatus",
        ),
        nullable=False,
        default=IncidentStatus.OPEN,
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