"""restore investigations table"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "aac0f3f1fbd8"
down_revision: Union[str, Sequence[str], None] = "813e1da64013"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "investigations",
        sa.Column(
            "id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "indicator_id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "score",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
        sa.Column(
            "risk_level",
            sa.String(length=20),
            nullable=False,
            server_default="LOW",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        "ix_investigations_id",
        "investigations",
        ["id"],
        unique=False,
    )

    op.create_index(
        "ix_investigations_indicator_id",
        "investigations",
        ["indicator_id"],
        unique=False,
    )

    op.alter_column(
        "investigations",
        "score",
        server_default=None,
    )

    op.alter_column(
        "investigations",
        "risk_level",
        server_default=None,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_investigations_indicator_id",
        table_name="investigations",
    )

    op.drop_index(
        "ix_investigations_id",
        table_name="investigations",
    )

    op.drop_table("investigations")