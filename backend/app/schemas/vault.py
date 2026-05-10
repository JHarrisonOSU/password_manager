from pydantic import BaseModel
from typing import Optional


class VaultItemCreate(BaseModel):
    website_name: str
    website_url: str       # NOT NULL in DB
    username: str
    encrypted_blob: str    # AES-256-GCM ciphertext from frontend
    iv: str                # initialization vector from frontend


class VaultItemUpdate(BaseModel):
    website_name: Optional[str] = None
    website_url: Optional[str] = None
    username: Optional[str] = None
    encrypted_blob: Optional[str] = None
    iv: Optional[str] = None


class VaultItemResponse(BaseModel):
    id: str
    website_name: str
    website_url: str
    username: str
    encrypted_blob: str
    iv: str
    created_at: str
    last_used_at: Optional[str]