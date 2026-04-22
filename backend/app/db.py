"""Supabase client singleton.

The backend uses the service-role key, which bypasses Row Level Security.
That is appropriate here because FastAPI is the trusted server enforcing
authorization (via JWT + ``user_id`` filtering). RLS remains as a
defense-in-depth layer for any client that hits Supabase directly.
"""

from functools import lru_cache

from supabase import Client, create_client

from app.config import get_settings


@lru_cache
def get_supabase() -> Client:
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_service_role_key)
