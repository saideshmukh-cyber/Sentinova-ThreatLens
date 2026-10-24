from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.db.database import Base


class IndicatorRelationship(Base):
    __tablename__ = "indicator_relationships"

    id: Mapped[int] = mapped_column(primary_key=True)
    source_indicator_id: Mapped[int] = mapped_column(ForeignKey("indicators.id"), nullable=False, index=True)
    target_indicator_id: Mapped[int] = mapped_column(ForeignKey("indicators.id"), nullable=False, index=True)
    relationship_type: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
