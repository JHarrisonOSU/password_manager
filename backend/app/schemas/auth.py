"""Pydantic models for the auth endpoints."""

from __future__ import annotations

from typing import Annotated, Optional

from pydantic import BaseModel, EmailStr, Field


# ─── Frontend-encryption primitives ──────────────────────────────────────────

class EncryptedVaultKey(BaseModel):
    """AES-GCM-encrypted vault key produced by the frontend."""
    iv: str
    ciphertext: str


class KdfParams(BaseModel):
    """Argon2id parameters used to derive auth_key + vault_key client-side."""
    iterations: int = Field(ge=1)
    memorySize: int = Field(ge=1024)
    parallelism: int = Field(ge=1)
    hashLength: int = Field(ge=16)


# Salts come over the wire as a JSON array of byte values (Uint8Array).
# Each value must be 0-255; total length must be a sane salt size.
SaltBytes = Annotated[
    list[Annotated[int, Field(ge=0, le=255)]],
    Field(min_length=16, max_length=64),
]


# ─── Requests ────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: EmailStr
    auth_key: str                         # hex string; raw bytes hashed server-side
    salt_auth: SaltBytes
    salt_enc: SaltBytes
    kdf: KdfParams
    encrypted_vault_key: EncryptedVaultKey


class LoginRequest(BaseModel):
    email: EmailStr
    auth_key: str                         # hex string, NOT the raw master password


# ─── Responses ───────────────────────────────────────────────────────────────

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class LoginResponse(TokenResponse):
    """Bearer-token response that also carries the encrypted vault key.

    Returned only when MFA is *not* enabled. With MFA on, login returns a
    plain :class:`TokenResponse` with ``token_type='pre_auth'`` and the
    encrypted vault key is delivered later by ``/auth/mfa/verify``.
    """
    encrypted_vault_key: Optional[EncryptedVaultKey] = None


class SaltResponse(BaseModel):
    salt_auth: list[int]
    salt_enc: list[int]
    kdf: KdfParams
    encrypted_vault_key: EncryptedVaultKey


class UserPublic(BaseModel):
    id: str
    email: EmailStr
    mfa_enabled: bool = False
