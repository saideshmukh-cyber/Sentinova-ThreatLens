from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, JSON, Text

from sqlalchemy.orm import Mapped, mapped_column

from backend.app.db.database import Base


class IndicatorEnrichment(Base):
    __tablename__ = "indicator_enrichments"

    id: Mapped[int] = mapped_column(
        primary_key=True,
    )

    indicator_id: Mapped[int] = mapped_column(
        ForeignKey("indicators.id"),
        nullable=False,
    )

    source: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    data: Mapped[dict] = mapped_column(
        JSON,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )