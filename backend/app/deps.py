"""Reusable FastAPI dependencies."""

from __future__ import annotations

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase import Client

from app.db import get_supabase
from app.schemas.auth import UserPublic
from app.security import decode_access_token

# HTTPBearer renders a single "paste your token" field in Swagger's Authorize UI
bearer_scheme = HTTPBearer(auto_error=True)


def _credentials_error(detail: str = "Could not validate credentials") -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    supabase: Client = Depends(get_supabase),
) -> UserPublic:
    """Resolve the bearer token to the authenticated user.

    Pre-auth tokens (issued mid-MFA) are explicitly rejected so they can
    never be used to access protected resources before MFA completes.
    """
    try:
        payload = decode_access_token(credentials.credentials)
    except jwt.ExpiredSignatureError:
        raise _credentials_error("Token expired")
    except jwt.PyJWTError:
        raise _credentials_error()

    if payload.get("scope") == "pre_auth":
        raise _credentials_error("MFA verification required")

    user_id = payload.get("sub")
    if not user_id:
        raise _credentials_error()

    res = (
        supabase.table("users")
        .select("id, email, mfa_enabled")
        .eq("id", user_id)
        .limit(1)
        .execute()
    )
    rows = res.data or []
    if not rows:
        raise _credentials_error("User no longer exists")

    row = rows[0]
    return UserPublic(
        id=str(row["id"]),
        email=row["email"],
        mfa_enabled=bool(row.get("mfa_enabled", False)),
    )
