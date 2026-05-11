"""Password hashing (bcrypt) and JWT issuance/verification helpers."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt
import jwt

from app.config import get_settings

# bcrypt has a hard 72-byte input limit. Longer inputs are silently truncated,
# which is a footgun; we reject them explicitly instead.
_BCRYPT_MAX_BYTES = 72


def hash_password(password: str) -> str:
    """Return a bcrypt hash for a plaintext password (utf-8)."""
    pw_bytes = password.encode("utf-8")
    if len(pw_bytes) > _BCRYPT_MAX_BYTES:
        raise ValueError(
            f"password exceeds bcrypt's {_BCRYPT_MAX_BYTES}-byte limit"
        )
    return bcrypt.hashpw(pw_bytes, bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    """Constant-time verify a plaintext password against a stored hash."""
    pw_bytes = password.encode("utf-8")
    if len(pw_bytes) > _BCRYPT_MAX_BYTES:
        return False
    try:
        return bcrypt.checkpw(pw_bytes, password_hash.encode("utf-8"))
    except ValueError:
        return False


def hash_auth_key(key_bytes: bytes) -> str:
    """Bcrypt-hash a binary auth key (raw bytes from client-side Argon2id).

    The frontend derives an N-byte auth_key with Argon2id and sends it as a
    hex string. We hash the raw bytes (not the hex) so storage is independent
    of transport encoding.
    """
    if len(key_bytes) > _BCRYPT_MAX_BYTES:
        raise ValueError(
            f"auth key exceeds bcrypt's {_BCRYPT_MAX_BYTES}-byte limit"
        )
    return bcrypt.hashpw(key_bytes, bcrypt.gensalt()).decode("utf-8")


def verify_auth_key(key_bytes: bytes, key_hash: str) -> bool:
    """Constant-time verify a binary auth key against a stored bcrypt hash."""
    if len(key_bytes) > _BCRYPT_MAX_BYTES:
        return False
    try:
        return bcrypt.checkpw(key_bytes, key_hash.encode("utf-8"))
    except ValueError:
        return False


def create_access_token(
    subject: str,
    extra_claims: dict[str, Any] | None = None,
    expires_in: int | None = None,
) -> tuple[str, int]:
    """Create a signed JWT for ``subject``.

    Returns ``(token, expires_in_seconds)``. If ``expires_in`` is omitted,
    falls back to the configured default (``JWT_EXPIRES_MINUTES``).
    """
    settings = get_settings()
    if expires_in is None:
        expires_in = settings.jwt_expires_minutes * 60

    now = datetime.now(timezone.utc)
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


def create_pre_auth_token(subject: str) -> tuple[str, int]:
    """Short-lived (5 min) token issued after password check when MFA is on.

    Carries ``scope='pre_auth'`` so protected routes can explicitly reject it
    until the user completes MFA verification.
    """
    return create_access_token(
        subject=subject,
        extra_claims={"scope": "pre_auth"},
        expires_in=300,
    )
