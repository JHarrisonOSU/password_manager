"""Password hashing (bcrypt) and JWT issuance/verification helpers."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt
import jwt

from app.config import get_settings

# bcrypt has a hard 72-byte input limit. Longer passwords are silently
# truncated, which is a footgun. We reject them up front instead.
_BCRYPT_MAX_BYTES = 72


def hash_password(password: str) -> str:
    """Return a bcrypt hash (utf-8 string) for the given password."""
    pw_bytes = password.encode("utf-8")
    if len(pw_bytes) > _BCRYPT_MAX_BYTES:
        raise ValueError(
            f"password exceeds bcrypt's {_BCRYPT_MAX_BYTES}-byte limit"
        )
    return bcrypt.hashpw(pw_bytes, bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    """Constant-time verify a password against a stored bcrypt hash."""
    pw_bytes = password.encode("utf-8")
    if len(pw_bytes) > _BCRYPT_MAX_BYTES:
        return False
    try:
        return bcrypt.checkpw(pw_bytes, password_hash.encode("utf-8"))
    except ValueError:
        # Malformed hash in DB — treat as auth failure rather than 500.
        return False


def create_access_token(
    subject: str, extra_claims: dict[str, Any] | None = None
) -> tuple[str, int]:
    """Create a signed JWT for ``subject`` (the user id).

    Returns ``(token, expires_in_seconds)``.
    """
    settings = get_settings()
    now = datetime.now(timezone.utc)
    expires_in = settings.jwt_expires_minutes * 60
    payload: dict[str, Any] = {
        "sub": subject,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(seconds=expires_in)).timestamp()),
    }
    if extra_claims:
        payload.update(extra_claims)
    token = jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    return token, expires_in


def decode_access_token(token: str) -> dict[str, Any]:
    """Decode + verify a JWT. Raises :class:`jwt.PyJWTError` on failure."""
    settings = get_settings()
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
