"""Pydantic models for the MFA endpoints."""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel

from app.schemas.auth import EncryptedVaultKey


class MFASetupResponse(BaseModel):
    totp_uri: str          # frontend renders this as a QR code
    secret: str            # shown as manual-entry fallback during setup


class MFAVerifySetupRequest(BaseModel):
    code: str              # 6-digit TOTP code confirming enrollment


class MFAVerifyRequest(BaseModel):
    pre_auth_token: str    # short-lived token issued by /auth/login
    code: str              # 6-digit TOTP code


class MFAVerifyResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    # Returned alongside the bearer token so MFA users can decrypt the vault
    # — same field that non-MFA users get from /auth/login.
    encrypted_vault_key: Optional[EncryptedVaultKey] = None
