from datetime import datetime

from sqlalchemy import (
    DateTime,
    Index,
    Text,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
)

from backend.app.db.database import Base


class SecurityEvent(Base):
    __tablename__ = "security_events"

    __table_args__ = (
        Index(
            "ix_security_events_indicator_timestamp",
            "indicator_value",
            "timestamp",
        ),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True,
    )

    source: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    event_type: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    category: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    indicator_value: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    timestamp: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )