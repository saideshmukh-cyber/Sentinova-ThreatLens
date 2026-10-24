"""add authentication lockout fields

Revision ID: f2a7b8c9d0e1
Revises: d7e2f3a4b5c6
"""
from alembic import op
import sqlalchemy as sa

revision = "f2a7b8c9d0e1"
down_revision = "d7e2f3a4b5c6"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("users", sa.Column("failed_login_attempts", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("users", sa.Column("locked_until", sa.DateTime(), nullable=True))
    op.add_column("users", sa.Column("last_login_at", sa.DateTime(), nullable=True))
    op.alter_column("users", "failed_login_attempts", server_default=None)


def downgrade():
    op.drop_column("users", "last_login_at")
    op.drop_column("users", "locked_until")
    op.drop_column("users", "failed_login_attempts")
