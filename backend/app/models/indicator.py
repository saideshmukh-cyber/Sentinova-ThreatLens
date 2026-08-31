from datetime import datetime

from sqlalchemy import DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.db.database import Base


class Indicator(Base):
    __tablename__ = "indicators"

    id: Mapped[int] = mapped_column(primary_key=True)
    indicator_type: Mapped[str] = mapped_column(String(50), nullable=False)
    value: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )