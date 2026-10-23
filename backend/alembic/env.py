from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config
from sqlalchemy import pool

from backend.app.config import settings
from backend.app.db.database import Base

from backend.app.models.alert import Alert
from backend.app.models.alert_rule import AlertRule
from backend.app.models.enrichment import IndicatorEnrichment
from backend.app.models.incident import Incident
from backend.app.models.incident_timeline import IncidentTimeline
from backend.app.models.indicator import Indicator
from backend.app.models.investigation import Investigation
from backend.app.models.security_event import SecurityEvent
from backend.app.models.user import User
from backend.app.models.audit_log import AuditLog
from backend.app.models.feed_config import FeedConfig
from backend.app.models.saved_hunt import SavedHunt
from backend.app.models.indicator_source import IndicatorSource
from backend.app.models.relationship import IndicatorRelationship


config = context.config


if config.config_file_name is not None:
    fileConfig(config.config_file_name)


target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = settings.database_url

    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={
            "paramstyle": "named",
        },
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    config.set_main_option(
        "sqlalchemy.url",
        settings.database_url,
    )

    connectable = engine_from_config(
        config.get_section(
            config.config_ini_section,
            {},
        ),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()