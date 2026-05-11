"""Authentication endpoints: register, login, salt lookup, me."""

from __future__ import annotations

import hashlib

from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client

from app.db import get_supabase
from app.deps import get_current_user
from app.schemas.auth import (
    EncryptedVaultKey,
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    SaltResponse,
    TokenResponse,
    UserPublic,
)
from app.security import (
    create_access_token,
    create_pre_auth_token,
    hash_auth_key,
    verify_auth_key,
)

router = APIRouter(prefix="/auth", tags=["auth"])

_USER_COLUMNS = (
    "id, email, master_password_hash, mfa_enabled, "
    "salt_auth, salt_enc, kdf, encrypted_vault_key"
)


def _find_user_by_email(supabase: Client, email: str) -> dict | None:
    res = (
        supabase.table("users")
        .select(_USER_COLUMNS)
        .eq("email", email)
        .limit(1)
        .execute()
    )
    rows = res.data or []
    return rows[0] if rows else None


def _fake_salt_response(email: str) -> SaltResponse:
    """Deterministic stand-in salts for unknown emails.

    Same email always returns the same fake salts so an attacker can't tell a
    registered email from an unregistered one by diffing the response.
    """
    def fake_salt(seed: str) -> list[int]:
        digest = hashlib.sha256(seed.encode()).digest()[:16]
        return list(digest)

    return SaltResponse(
        salt_auth=fake_salt(email + "auth"),
        salt_enc=fake_salt(email + "enc"),
        kdf={
            "iterations": 3,
            "memorySize": 65536,
            "parallelism": 1,
            "hashLength": 32,
        },
        encrypted_vault_key=EncryptedVaultKey(iv="", ciphertext=""),
    )


# ─── Endpoints ───────────────────────────────────────────────────────────────

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(
    body: RegisterRequest,
    supabase: Client = Depends(get_supabase),
) -> dict:
    email = body.email.lower()

    if _find_user_by_email(supabase, email) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    try:
        auth_key_bytes = bytes.fromhex(body.auth_key)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="auth_key must be a hex-encoded string",
        )

    try:
        auth_hash = hash_auth_key(auth_key_bytes)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e)
        )

    insert_res = (
        supabase.table("users")
        .insert(
            {
                "email": email,
                "master_password_hash": auth_hash,
                "salt_auth": body.salt_auth,
                "salt_enc": body.salt_enc,
                "kdf": body.kdf.model_dump(),
                "encrypted_vault_key": body.encrypted_vault_key.model_dump(),
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

    return {"message": "User registered successfully", "user_id": rows[0]["id"]}


@router.post("/login", response_model=LoginResponse)
def login(
    body: LoginRequest,
    supabase: Client = Depends(get_supabase),
) -> LoginResponse:
    email = body.email.lower()
    user = _find_user_by_email(supabase, email)

    # Same error for "no such user" and "wrong key" so we don't leak which
    # emails are registered.
    invalid = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid email or password",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if user is None:
        raise invalid

    try:
        auth_key_bytes = bytes.fromhex(body.auth_key)
    except ValueError:
        raise invalid

    if not verify_auth_key(auth_key_bytes, user["master_password_hash"]):
        raise invalid

    if user.get("mfa_enabled"):
        # Password verified but MFA still required. Issue a short-lived
        # pre-auth token; the encrypted vault key is delivered later by
        # /auth/mfa/verify.
        token, expires_in = create_pre_auth_token(subject=str(user["id"]))
        return LoginResponse(
            access_token=token,
            token_type="pre_auth",
            expires_in=expires_in,
            encrypted_vault_key=None,
        )

    token, expires_in = create_access_token(subject=str(user["id"]))
    return LoginResponse(
        access_token=token,
        token_type="bearer",
        expires_in=expires_in,
        encrypted_vault_key=user.get("encrypted_vault_key"),
    )


@router.get("/salt", response_model=SaltResponse)
def get_salt(
    email: str,
    supabase: Client = Depends(get_supabase),
) -> SaltResponse:
    """Return salts + KDF params + encrypted vault key for an email.

    Unknown emails get deterministic fake values so an attacker can't tell
    registered from unregistered emails by diffing this endpoint.
    """
    normalized = email.lower()
    user = _find_user_by_email(supabase, normalized)
    if user is None:
        return _fake_salt_response(normalized)

    return SaltResponse(
        salt_auth=user["salt_auth"],
        salt_enc=user["salt_enc"],
        kdf=user["kdf"],
        encrypted_vault_key=user["encrypted_vault_key"],
    )


@router.get("/me", response_model=UserPublic)
def me(current_user: UserPublic = Depends(get_current_user)) -> UserPublic:
    return current_user
