"""MFA endpoints: TOTP enrollment, confirm, and login-time verification."""

from __future__ import annotations

import jwt
import pyotp
from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client

from app.db import get_supabase
from app.deps import get_current_user
from app.schemas.auth import UserPublic
from app.schemas.mfa import (
    MFASetupResponse,
    MFAVerifyRequest,
    MFAVerifyResponse,
    MFAVerifySetupRequest,
)
from app.security import create_access_token, decode_access_token

router = APIRouter(prefix="/auth/mfa", tags=["mfa"])

# A small clock-skew window is standard for TOTP. valid_window=1 accepts the
# previous, current, and next 30-second steps (90s total tolerance) — enough
# for typical phone clock drift without meaningfully widening attack surface.
_TOTP_WINDOW = 1


@router.post("/setup", response_model=MFASetupResponse)
def mfa_setup(
    current_user: UserPublic = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
) -> MFASetupResponse:
    """Generate a TOTP secret and return a provisioning URI for the QR code.

    Refuses if MFA is already enabled — re-enrollment must go through an
    explicit disable flow (not yet implemented) so a stolen bearer token
    cannot silently rotate someone's MFA secret.
    """
    if current_user.mfa_enabled:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="MFA is already enabled for this account",
        )

    secret = pyotp.random_base32()
    uri = pyotp.TOTP(secret).provisioning_uri(
        name=current_user.email,
        issuer_name="Secure Password Manager",
    )

    # Stored but not yet activated — /verify-setup flips mfa_enabled.
    supabase.table("users").update({"mfa_secret": secret}).eq(
        "id", current_user.id
    ).execute()

    return MFASetupResponse(totp_uri=uri, secret=secret)


@router.post("/verify-setup", status_code=status.HTTP_200_OK)
def mfa_verify_setup(
    body: MFAVerifySetupRequest,
    current_user: UserPublic = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
) -> dict:
    """Confirm the first TOTP code and activate MFA on the account."""
    res = (
        supabase.table("users")
        .select("mfa_secret")
        .eq("id", current_user.id)
        .limit(1)
        .execute()
    )
    rows = res.data or []
    if not rows or not rows[0].get("mfa_secret"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MFA setup not initiated",
        )

    secret = rows[0]["mfa_secret"]
    if not pyotp.TOTP(secret).verify(body.code, valid_window=_TOTP_WINDOW):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid TOTP code",
        )

    supabase.table("users").update({"mfa_enabled": True}).eq(
        "id", current_user.id
    ).execute()

    return {"message": "MFA enabled successfully"}


@router.post("/verify", response_model=MFAVerifyResponse)
def mfa_verify(
    body: MFAVerifyRequest,
    supabase: Client = Depends(get_supabase),
) -> MFAVerifyResponse:
    """Exchange a pre-auth token + valid TOTP code for a full bearer token.

    Also returns the encrypted vault key so the frontend can decrypt the
    vault — same field non-MFA users get directly from /auth/login.
    """
    try:
        payload = decode_access_token(body.pre_auth_token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Pre-auth token expired",
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid pre-auth token",
        )

    if payload.get("scope") != "pre_auth":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token scope",
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid pre-auth token",
        )

    res = (
        supabase.table("users")
        .select("id, mfa_secret, mfa_enabled, encrypted_vault_key")
        .eq("id", user_id)
        .limit(1)
        .execute()
    )
    rows = res.data or []
    if not rows:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found"
        )

    user = rows[0]
    if not user.get("mfa_enabled") or not user.get("mfa_secret"):
        # Defensive: if the row drifted (admin disabled MFA, race during
        # enrollment, etc.), reject rather than silently issuing a token.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="MFA is not active for this account",
        )

    if not pyotp.TOTP(user["mfa_secret"]).verify(body.code, valid_window=_TOTP_WINDOW):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid TOTP code"
        )

    token, expires_in = create_access_token(subject=str(user["id"]))
    return MFAVerifyResponse(
        access_token=token,
        token_type="bearer",
        expires_in=expires_in,
        encrypted_vault_key=user.get("encrypted_vault_key"),
    )
