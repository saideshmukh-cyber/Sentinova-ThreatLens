"""add indicator severity score and indexes"""

from alembic import op
import sqlalchemy as sa


revision = "884b0b3c5969"
down_revision = "d195e05cec1f"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "indicators",
        sa.Column(
            "severity_score",
            sa.SmallInteger(),
            nullable=False,
            server_default="0",
        ),
    )

    op.create_index(
        "ix_indicators_value_type_status",
        "indicators",
        ["value", "indicator_type"],
    )

    op.create_index(
        "ix_indicators_severity_score",
        "indicators",
        ["severity_score"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_indicators_severity_score",
        table_name="indicators",
    )

    op.drop_index(
        "ix_indicators_value_type_status",
        table_name="indicators",
    )

    op.drop_column(
        "indicators",
        "severity_score",
    )