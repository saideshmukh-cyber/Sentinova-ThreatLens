from datetime import datetime

from sqlalchemy import (
    DateTime,
    Text,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
)

from backend.app.db.database import Base


class SecurityEvent(Base):
    __tablename__ = "security_events"

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