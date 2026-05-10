"""Vault CRUD endpoints."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client

from app.db import get_supabase
from app.deps import get_current_user
from app.schemas.auth import UserPublic
from app.schemas.vault import VaultItemCreate, VaultItemUpdate, VaultItemResponse

router = APIRouter(prefix="/vault", tags=["vault"])


@router.post("", response_model=VaultItemResponse, status_code=status.HTTP_201_CREATED)
def create_vault_item(
    body: VaultItemCreate,
    current_user: UserPublic = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
) -> VaultItemResponse:
    res = supabase.table("vault_items").insert({
        "user_id": current_user.id,
        "website_name": body.website_name,
        "website_url": body.website_url,
        "username": body.username,
        "encrypted_blob": body.encrypted_blob,
        "iv": body.iv,
    }).execute()

    rows = res.data or []
    if not rows:
        raise HTTPException(status_code=500, detail="Failed to create vault item")

    return _to_response(rows[0])


@router.get("", response_model=list[VaultItemResponse])
def get_vault_items(
    current_user: UserPublic = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
) -> list[VaultItemResponse]:
    res = (
        supabase.table("vault_items")
        .select("*")
        .eq("user_id", current_user.id)
        .order("date_created", desc=True)
        .execute()
    )
    return [_to_response(row) for row in (res.data or [])]


@router.put("/{item_id}", response_model=VaultItemResponse)
def update_vault_item(
    item_id: UUID,
    body: VaultItemUpdate,
    current_user: UserPublic = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
) -> VaultItemResponse:
    item_id_str = str(item_id)

    existing = (
        supabase.table("vault_items")
        .select("entry_id")
        .eq("entry_id", item_id_str)
        .eq("user_id", current_user.id)
        .limit(1)
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Vault item not found")

    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    res = (
        supabase.table("vault_items")
        .update(updates)
        .eq("entry_id", item_id_str)
        .eq("user_id", current_user.id)
        .execute()
    )

    rows = res.data or []
    if not rows:
        raise HTTPException(status_code=500, detail="Failed to update vault item")

    return _to_response(rows[0])


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vault_item(
    item_id: UUID,
    current_user: UserPublic = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    item_id_str = str(item_id)

    existing = (
        supabase.table("vault_items")
        .select("entry_id")
        .eq("entry_id", item_id_str)
        .eq("user_id", current_user.id)
        .limit(1)
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Vault item not found")

    supabase.table("vault_items").delete().eq("entry_id", item_id_str).eq(
        "user_id", current_user.id
    ).execute()


def _to_response(row: dict) -> VaultItemResponse:
    return VaultItemResponse(
        id=str(row["entry_id"]),
        website_name=row["website_name"],
        website_url=row["website_url"],
        username=row["username"],
        encrypted_blob=row["encrypted_blob"],
        iv=row["iv"],
        created_at=str(row["date_created"]),
        last_used_at=str(row["date_last_used"]) if row.get("date_last_used") else None,
    )