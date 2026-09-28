import base64
import hashlib
import hmac
import json
import secrets
import time

from fastapi import HTTPException
from sqlalchemy.orm import Session

from backend.app.config import settings
from backend.app.models.user import User


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    derived = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 210_000)
    return (
        "pbkdf2_sha256$210000$"
        f"{base64.urlsafe_b64encode(salt).decode()}$"
        f"{base64.urlsafe_b64encode(derived).decode()}"
    )


def verify_password(password: str, stored: str) -> bool:
    try:
        _, rounds, salt_b64, digest_b64 = stored.split("$", 3)
        salt = base64.urlsafe_b64decode(salt_b64.encode())
        expected = base64.urlsafe_b64decode(digest_b64.encode())
        actual = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, int(rounds))
        return hmac.compare_digest(actual, expected)
    except Exception:
        return False


def _b64(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _unb64(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))


def _create_token(user: User, ttl_minutes: int, token_type: str) -> str:
    header = _b64(json.dumps({"alg": "HS256", "typ": "JWT"}, separators=(",", ":")).encode())
    payload = _b64(
        json.dumps(
            {
                "sub": user.username,
                "role": user.role,
                "typ": token_type,
                "exp": int(time.time()) + ttl_minutes * 60,
            },
            separators=(",", ":"),
        ).encode()
    )
    unsigned = f"{header}.{payload}".encode()
    signature = _b64(hmac.new(settings.jwt_secret.encode(), unsigned, hashlib.sha256).digest())
    return f"{header}.{payload}.{signature}"


def create_token(user: User, ttl_minutes: int = 60) -> str:
    return _create_token(user, ttl_minutes, "access")


def create_refresh_token(user: User, ttl_minutes: int = 60 * 24 * 7) -> str:
    return _create_token(user, ttl_minutes, "refresh")


def decode_token(token: str, expected_type: str | None = None):
    try:
        header, payload, signature = token.split(".", 2)
        unsigned = f"{header}.{payload}".encode()
        expected = _b64(hmac.new(settings.jwt_secret.encode(), unsigned, hashlib.sha256).digest())
        if not hmac.compare_digest(signature, expected):
            return None
        data = json.loads(_unb64(payload))
        if int(data.get("exp", 0)) < int(time.time()):
            return None
        if expected_type and data.get("typ", "access") != expected_type:
            return None
        return data
    except Exception:
        return None


def authenticate(db: Session, username: str, password: str):
    user = db.query(User).filter(User.username == username.strip()).first()
    if user is None or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    return user


def bootstrap_admin(db: Session):
    username = settings.bootstrap_admin_username.strip()
    password = settings.bootstrap_admin_password
    if not username or not password:
        return
    if db.query(User.id).filter(User.username == username).first() is None:
        db.add(User(username=username, password_hash=hash_password(password), role="admin"))
        db.commit()
