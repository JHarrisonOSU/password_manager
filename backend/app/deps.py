"""Reusable FastAPI dependencies."""

from __future__ import annotations

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from supabase import Client

from app.db import get_supabase
from app.schemas.auth import UserPublic
from app.security import decode_access_token

# tokenUrl powers the "Authorize" button in Swagger UI.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=True)


def _credentials_error(detail: str = "Could not validate credentials") -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_current_user(
    token: str = Depends(oauth2_scheme),
    supabase: Client = Depends(get_supabase),
) -> UserPublic:
    try:
        payload = decode_access_token(token)
    except jwt.ExpiredSignatureError:
        raise _credentials_error("Token expired")
    except jwt.PyJWTError:
        raise _credentials_error()

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
