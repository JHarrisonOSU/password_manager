"""Authentication endpoints: register, login, me."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client

from app.db import get_supabase
from app.deps import get_current_user
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserPublic,
)
from app.security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


def _find_user_by_email(supabase: Client, email: str) -> dict | None:
    res = (
        supabase.table("users")
        .select("id, email, master_password_hash, mfa_enabled")
        .eq("email", email)
        .limit(1)
        .execute()
    )
    rows = res.data or []
    return rows[0] if rows else None


@router.post(
    "/register",
    response_model=UserPublic,
    status_code=status.HTTP_201_CREATED,
)
def register(
    body: RegisterRequest,
    supabase: Client = Depends(get_supabase),
) -> UserPublic:
    email = body.email.lower()

    if _find_user_by_email(supabase, email) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email is already registered",
        )

    try:
        password_hash = hash_password(body.master_password)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e)
        )

    insert_res = (
        supabase.table("users")
        .insert(
            {
                "email": email,
                "master_password_hash": password_hash,
                "mfa_enabled": False,
            }
        )
        .execute()
    )

    rows = insert_res.data or []
    if not rows:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user",
        )

    row = rows[0]
    return UserPublic(
        id=str(row["id"]),
        email=row["email"],
        mfa_enabled=bool(row.get("mfa_enabled", False)),
    )


@router.post("/login", response_model=TokenResponse)
def login(
    body: LoginRequest,
    supabase: Client = Depends(get_supabase),
) -> TokenResponse:
    email = body.email.lower()
    user = _find_user_by_email(supabase, email)

    invalid = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid email or password",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if user is None:
        raise invalid
    if not verify_password(body.master_password, user["master_password_hash"]):
        raise invalid

    token, expires_in = create_access_token(subject=str(user["id"]))
    return TokenResponse(access_token=token, expires_in=expires_in)


@router.get("/me", response_model=UserPublic)
def me(current_user: UserPublic = Depends(get_current_user)) -> UserPublic:
    return current_user
