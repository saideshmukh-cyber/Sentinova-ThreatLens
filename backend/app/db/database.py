from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from backend.app.config import settings


class Base(DeclarativeBase):
    pass


engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
)


SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


# Import models after Base has been created.
from backend.app.models.indicator import Indicator  # noqa: E402,F401
from backend.app.models.enrichment import IndicatorEnrichment  # noqa: E402,F401
from backend.app.models.alert import Alert  # noqa: E402,F401
from backend.app.models.alert_rule import AlertRule  # noqa: E402,F401
from backend.app.models.incident import Incident  # noqa: E402,F401
from backend.app.models.incident_timeline import IncidentTimeline  # noqa: E402,F401
from backend.app.models.security_event import SecurityEvent  # noqa: E402,F401
from backend.app.models.investigation import Investigation  # noqa: E402,F401
from backend.app.models.indicator_source import IndicatorSource  # noqa: E402,F401