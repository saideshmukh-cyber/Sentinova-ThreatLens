"""add ttl feed configs saved hunts dashboard layouts

Revision ID: d7e2f3a4b5c6
Revises: c8e7f1a9b2d3
"""

from alembic import op
import sqlalchemy as sa

revision = "d7e2f3a4b5c6"
down_revision = "c8e7f1a9b2d3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    indicator_columns = {column["name"] for column in inspector.get_columns("indicators")}
    if "ttl_days" not in indicator_columns:
        op.add_column("indicators", sa.Column("ttl_days", sa.SmallInteger(), nullable=True))

    user_columns = {column["name"] for column in inspector.get_columns("users")}
    if "dashboard_layout" not in user_columns:
        op.add_column(
            "users",
            sa.Column(
                "dashboard_layout",
                sa.JSON(),
                nullable=False,
                server_default=sa.text("'{}'::json"),
            ),
        )

    table_names = set(inspector.get_table_names())
    if "feed_configs" not in table_names:
        op.create_table(
            "feed_configs",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("name", sa.String(length=100), nullable=False, unique=True),
            sa.Column("description", sa.Text(), nullable=False),
            sa.Column("enabled", sa.Boolean(), nullable=False, server_default=sa.text("true")),
            sa.Column("schedule_minutes", sa.Integer(), nullable=False, server_default="1440"),
            sa.Column("last_run_at", sa.DateTime(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
            sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        )
        op.create_index("ix_feed_configs_name", "feed_configs", ["name"])
        op.bulk_insert(
            sa.table(
                "feed_configs",
                sa.column("name", sa.String()),
                sa.column("description", sa.Text()),
                sa.column("enabled", sa.Boolean()),
                sa.column("schedule_minutes", sa.Integer()),
            ),
            [
                {"name": "urlhaus", "description": "Malicious URLs from URLhaus", "enabled": True, "schedule_minutes": 1440},
                {"name": "threatfox", "description": "Recent IOCs from ThreatFox", "enabled": True, "schedule_minutes": 1440},
                {"name": "feodo-tracker", "description": "Feodo Tracker botnet IPs", "enabled": True, "schedule_minutes": 1440},
                {"name": "malwarebazaar", "description": "Recent malware hashes from MalwareBazaar", "enabled": True, "schedule_minutes": 1440},
                {"name": "otx", "description": "AlienVault OTX subscribed pulses", "enabled": True, "schedule_minutes": 1440},
                {"name": "cisa-kev", "description": "CISA Known Exploited Vulnerabilities catalog", "enabled": True, "schedule_minutes": 1440},
            ],
        )

    if "saved_hunts" not in table_names:
        op.create_table(
            "saved_hunts",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
            sa.Column("name", sa.String(length=200), nullable=False),
            sa.Column("query", sa.Text(), nullable=False),
            sa.Column("indicator_type", sa.String(length=50), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
            sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        )
        op.create_index("ix_saved_hunts_user_id", "saved_hunts", ["user_id"])


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "saved_hunts" in inspector.get_table_names():
        op.drop_index("ix_saved_hunts_user_id", table_name="saved_hunts")
        op.drop_table("saved_hunts")
    if "feed_configs" in inspector.get_table_names():
        op.drop_index("ix_feed_configs_name", table_name="feed_configs")
        op.drop_table("feed_configs")
    user_columns = {column["name"] for column in inspector.get_columns("users")}
    if "dashboard_layout" in user_columns:
        op.drop_column("users", "dashboard_layout")
    indicator_columns = {column["name"] for column in inspector.get_columns("indicators")}
    if "ttl_days" in indicator_columns:
        op.drop_column("indicators", "ttl_days")
