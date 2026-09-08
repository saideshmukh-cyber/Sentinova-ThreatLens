"""add alerts table

Revision ID: 40c0100da918
Revises: cc48077cbedb
Create Date: 2026-09-08 12:25:55.471441
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "40c0100da918"
down_revision: Union[str, Sequence[str], None] = "cc48077cbedb"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "alerts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("indicator_id", sa.Integer(), nullable=False),
        sa.Column("severity_score", sa.Integer(), nullable=False),
        sa.Column("rule", sa.Text(), nullable=False),
        sa.Column(
            "status",
            sa.Enum(
                "new",
                "acknowledged",
                "in-progress",
                "resolved",
                "closed",
                name="alertstatus",
            ),
            nullable=False,
        ),
        sa.Column("assignee", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ["indicator_id"],
            ["indicators.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table("alerts")