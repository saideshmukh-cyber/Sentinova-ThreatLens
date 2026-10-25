"""add indicator type and uniqueness

Revision ID: 414360b6d31c
Revises: fb9f9e141c70
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "414360b6d31c"
down_revision: Union[str, Sequence[str], None] = "fb9f9e141c70"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create the PostgreSQL ENUM type.
    indicator_type_enum = sa.Enum(
        "ip",
        "domain",
        "url",
        "hash",
        "email",
        "cve",
        name="indicatortype",
    )

    indicator_type_enum.create(
        op.get_bind(),
        checkfirst=True,
    )

    # Convert indicator_type from VARCHAR to the ENUM.
    op.alter_column(
        "indicators",
        "indicator_type",
        existing_type=sa.VARCHAR(length=50),
        type_=indicator_type_enum,
        postgresql_using="indicator_type::text::indicatortype",
        existing_nullable=False,
    )

    # Prevent duplicate indicator values.
    op.create_unique_constraint(
        "uq_indicators_value",
        "indicators",
        ["value"],
    )


def downgrade() -> None:
    # Remove the unique constraint.
    op.drop_constraint(
        "uq_indicators_value",
        "indicators",
        type_="unique",
    )

    # Convert ENUM back to VARCHAR.
    op.alter_column(
        "indicators",
        "indicator_type",
        existing_type=sa.Enum(
            "ip",
            "domain",
            "url",
            "hash",
            "email",
            "cve",
            name="indicatortype",
        ),
        type_=sa.VARCHAR(length=50),
        postgresql_using="indicator_type::text",
        existing_nullable=False,
    )

    # Remove the PostgreSQL ENUM.
    sa.Enum(
        "ip",
        "domain",
        "url",
        "hash",
        name="indicatortype",
    ).drop(
        op.get_bind(),
        checkfirst=True,
    )