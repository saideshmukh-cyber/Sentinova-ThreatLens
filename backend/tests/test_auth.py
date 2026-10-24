import os
os.environ.setdefault("DATABASE_URL", "postgresql+psycopg://test:test@localhost:5432/test")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/0")
os.environ.setdefault("ELASTICSEARCH_URL", "http://localhost:9200")
os.environ.setdefault("JWT_SECRET", "unit-test-secret")

from backend.app.services.auth_service import create_token, decode_token, hash_password, verify_password
from backend.app.authorization import is_allowed


class User:
    username = "alice"
    role = "analyst"


def test_password_hash_roundtrip():
    password = "StrongPass1"
    stored = hash_password(password)
    assert stored != password
    assert verify_password(password, stored)
    assert not verify_password("wrong", stored)


def test_access_token_type_is_enforced():
    token = create_token(User())
    assert decode_token(token, expected_type="access")["sub"] == "alice"
    assert decode_token(token, expected_type="refresh") is None


def test_rbac_is_server_side():
    assert is_allowed("analyst", "GET", "/api/v1/indicators/")
    assert not is_allowed("executive", "POST", "/api/v1/indicators/")
    assert is_allowed("admin", "DELETE", "/api/v1/users/1")
