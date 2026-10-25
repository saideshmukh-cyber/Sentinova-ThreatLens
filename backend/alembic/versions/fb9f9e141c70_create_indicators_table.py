
"""create indicators table

Revision ID: fb9f9e141c70
Revises:
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "fb9f9e141c70"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create the base indicators table."""
    op.create_table(
        "indicators",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("indicator_type", sa.String(length=50), nullable=False),
        sa.Column("value", sa.Text(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )


def downgrade() -> None:
    """Remove the indicators table."""
    op.drop_table("indicators")
