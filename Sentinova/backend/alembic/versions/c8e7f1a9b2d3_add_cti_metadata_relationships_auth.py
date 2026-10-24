"""add cti metadata relationships audit auth

Revision ID: c8e7f1a9b2d3
Revises: 884b0b3c5969
"""

from alembic import op
import sqlalchemy as sa


revision = "c8e7f1a9b2d3"
down_revision = "884b0b3c5969"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    indicator_columns = {
        column["name"] for column in inspector.get_columns("indicators")
    }

    indicator_columns_to_add = [
        ("confidence", sa.SmallInteger(), sa.text("0"), False),
        ("tlp", sa.String(length=20), sa.text("'clear'"), False),
        ("status", sa.String(length=30), sa.text("'active'"), False),
        ("tags", sa.JSON(), sa.text("'[]'::json"), False),
        ("attack_techniques", sa.JSON(), sa.text("'[]'::json"), False),
        ("notes", sa.Text(), None, True),
        ("first_seen", sa.DateTime(), sa.text("CURRENT_TIMESTAMP"), False),
        ("last_seen", sa.DateTime(), sa.text("CURRENT_TIMESTAMP"), False),
        ("updated_at", sa.DateTime(), sa.text("CURRENT_TIMESTAMP"), False),
    ]

    for name, type_, default, nullable in indicator_columns_to_add:
        if name not in indicator_columns:
            op.add_column(
                "indicators",
                sa.Column(
                    name,
                    type_,
                    nullable=nullable,
                    server_default=default,
                ),
            )

    bind.execute(
        sa.text(
            "ALTER TYPE indicatortype ADD VALUE IF NOT EXISTS 'email'"
        )
    )

    bind.execute(
        sa.text(
            "ALTER TYPE indicatortype ADD VALUE IF NOT EXISTS 'cve'"
        )
    )

    table_names = set(inspector.get_table_names())

    if "indicator_relationships" not in table_names:
        op.create_table(
            "indicator_relationships",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column(
                "source_indicator_id",
                sa.Integer(),
                sa.ForeignKey("indicators.id"),
                nullable=False,
            ),
            sa.Column(
                "target_indicator_id",
                sa.Integer(),
                sa.ForeignKey("indicators.id"),
                nullable=False,
            ),
            sa.Column(
                "relationship_type",
                sa.String(length=100),
                nullable=False,
            ),
            sa.Column("created_at", sa.DateTime(), nullable=False),
        )

        op.create_index(
            "ix_indicator_relationships_source_indicator_id",
            "indicator_relationships",
            ["source_indicator_id"],
        )

        op.create_index(
            "ix_indicator_relationships_target_indicator_id",
            "indicator_relationships",
            ["target_indicator_id"],
        )

    if "audit_log" not in table_names:
        op.create_table(
            "audit_log",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column(
                "actor",
                sa.String(length=200),
                nullable=False,
            ),
            sa.Column(
                "action",
                sa.String(length=100),
                nullable=False,
            ),
            sa.Column(
                "entity_type",
                sa.String(length=100),
                nullable=False,
            ),
            sa.Column(
                "entity_id",
                sa.String(length=100),
                nullable=True,
            ),
            sa.Column(
                "details",
                sa.JSON(),
                nullable=False,
            ),
            sa.Column(
                "correlation_id",
                sa.String(length=100),
                nullable=True,
            ),
            sa.Column(
                "timestamp",
                sa.DateTime(),
                nullable=False,
            ),
        )

        op.create_index(
            "ix_audit_log_actor",
            "audit_log",
            ["actor"],
        )

        op.create_index(
            "ix_audit_log_action",
            "audit_log",
            ["action"],
        )

        op.create_index(
            "ix_audit_log_correlation_id",
            "audit_log",
            ["correlation_id"],
        )

        op.create_index(
            "ix_audit_log_timestamp",
            "audit_log",
            ["timestamp"],
        )

    if "users" not in table_names:
        op.create_table(
            "users",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column(
                "username",
                sa.String(length=100),
                nullable=False,
                unique=True,
            ),
            sa.Column(
                "password_hash",
                sa.String(length=300),
                nullable=False,
            ),
            sa.Column(
                "role",
                sa.String(length=50),
                nullable=False,
            ),
            sa.Column(
                "created_at",
                sa.DateTime(),
                nullable=False,
            ),
        )

        op.create_index(
            "ix_users_username",
            "users",
            ["username"],
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if "users" in inspector.get_table_names():
        op.drop_index(
            "ix_users_username",
            table_name="users",
        )
        op.drop_table("users")

    if "audit_log" in inspector.get_table_names():
        for index in [
            "ix_audit_log_timestamp",
            "ix_audit_log_correlation_id",
            "ix_audit_log_action",
            "ix_audit_log_actor",
        ]:
            op.drop_index(
                index,
                table_name="audit_log",
            )

        op.drop_table("audit_log")

    if "indicator_relationships" in inspector.get_table_names():
        op.drop_index(
            "ix_indicator_relationships_target_indicator_id",
            table_name="indicator_relationships",
        )

        op.drop_index(
            "ix_indicator_relationships_source_indicator_id",
            table_name="indicator_relationships",
        )

        op.drop_table("indicator_relationships")

    indicator_columns = {
        column["name"]
        for column in inspector.get_columns("indicators")
    }

    for name in [
        "updated_at",
        "last_seen",
        "first_seen",
        "notes",
        "attack_techniques",
        "tags",
        "status",
        "tlp",
        "confidence",
    ]:
        if name in indicator_columns:
            op.drop_column("indicators", name)