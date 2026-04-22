"""Pydantic models for the auth endpoints."""

from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    email: EmailStr
    # bcrypt's input limit is 72 bytes. We surface that constraint here so the
    # client gets a 422 rather than a 500.
    master_password: str = Field(..., min_length=8, max_length=72)


class LoginRequest(BaseModel):
    email: EmailStr
    master_password: str = Field(..., min_length=1, max_length=72)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class UserPublic(BaseModel):
    id: str
    email: EmailStr
    mfa_enabled: bool = False
