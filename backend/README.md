# SPM Backend (FastAPI)

Backend for the **Secure Password Manager** project. Exposes a JSON API that
the React/Vite frontend calls. The backend **never sees plaintext vault data**
or the master password — all encryption and decryption happen in the browser.

The backend is responsible for:

1. **Authentication** — verify a client-derived `auth_key` (bcrypt hash stored
   as `auth_key_hash`), issue JWTs, and optional TOTP MFA
2. **Key material storage** — persist salts, KDF params, and the encrypted
   vault key so the frontend can re-derive keys on login
3. **Vault storage** — store and return opaque `encrypted_blob` + `iv` rows
   (password and notes are encrypted client-side inside the blob)
4. **Authorization** — enforce per-user access on every protected route

## Project layout

```
spm/backend/
├── app/
│   ├── main.py              # FastAPI app, CORS, router mounting, /health
│   ├── config.py            # Settings from .env (pydantic-settings)
│   ├── db.py                # Supabase client (service role)
│   ├── security.py          # bcrypt + JWT helpers
│   ├── deps.py              # get_current_user (HTTPBearer + scope check)
│   ├── routers/
│   │   ├── auth.py          # register, login, salt, me
│   │   ├── mfa.py           # TOTP setup, verify-setup, verify
│   │   └── vault.py         # vault CRUD
│   └── schemas/
│       ├── auth.py
│       ├── mfa.py
│       └── vault.py
├── Procfile                 # Railway start command
├── requirements.txt
├── .env.example
└── README.md
```

## Setup

```bash
cd spm/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Fill in `.env`:

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role JWT (server only, never expose to browser) |
| `JWT_SECRET` | HS256 signing secret (≥32 chars) |
| `CORS_ORIGINS` | Comma-separated frontend origins (local + Vercel URL) |

Generate a strong `JWT_SECRET`:

```bash
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

## Run locally

```bash
uvicorn app.main:app --reload --port 8000
```

- Swagger UI: http://localhost:8000/docs
- ReDoc:      http://localhost:8000/redoc
- Health:     http://localhost:8000/health

For Swagger, click **Authorize** and paste a bearer token (the `eyJ...` string
only, no `Bearer ` prefix).

## Deploy (Railway)

Railway uses the `Procfile`:

```
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Set the same environment variables as `.env` in the Railway dashboard. Point
the frontend's `VITE_API_BASE_URL` at your Railway public URL and add that
origin to `CORS_ORIGINS`.

## Database (Supabase)

Expected tables (simplified):

**`users`** — `id`, `email`, `auth_key_hash`, `mfa_enabled`, `mfa_secret`,
`salt_auth`, `salt_enc`, `kdf`, `encrypted_vault_key`, `date_created`

**`vault_items`** — `entry_id`, `user_id`, `website_name`, `website_url`,
`username`, `encrypted_blob`, `iv`, `date_created`, `date_last_used`

The backend uses the **service-role** key and filters every vault query by
`user_id` from the JWT.

## API overview

### Auth (no token required unless noted)

| Method | Path | Description |
|---|---|---|
| `POST` | `/auth/register` | Create account (client sends `auth_key`, salts, KDF, encrypted vault key) |
| `POST` | `/auth/login` | Returns bearer JWT + `encrypted_vault_key`, or `pre_auth` token if MFA on |
| `GET` | `/auth/salt?email=` | Salts + KDF + encrypted vault key (fake data for unknown emails) |
| `GET` | `/auth/me` | Current user profile (Bearer token) |

### MFA

| Method | Path | Description |
|---|---|---|
| `POST` | `/auth/mfa/setup` | Generate TOTP secret + provisioning URI (Bearer) |
| `POST` | `/auth/mfa/verify-setup` | Confirm first TOTP code, enable MFA (Bearer) |
| `POST` | `/auth/mfa/verify` | Exchange `pre_auth` token + TOTP for full bearer + vault key |

When MFA is enabled, login returns `token_type: "pre_auth"` (5 min). Protected
routes reject pre-auth tokens until `/auth/mfa/verify` completes.

### Vault (Bearer token required)

| Method | Path | Description |
|---|---|---|
| `POST` | `/vault` | Create item |
| `GET` | `/vault` | List current user's items (newest first) |
| `PUT` | `/vault/{id}` | Partial update |
| `DELETE` | `/vault/{id}` | Delete item (204) |

### Meta

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Liveness check |

## Example payloads

### Register

The frontend derives `auth_key` from the master password with Argon2id; the
backend only stores a bcrypt hash of those bytes.

```json
{
  "email": "user@example.com",
  "auth_key": "9f8e7d6c5b4a3928171605f4e3d2c1b0a9988776655443322110ffeeddccbbaa",
  "salt_auth": [42, 17, 8, 99, 200, 31, 5, 88, 144, 7, 211, 60, 22, 175, 4, 250],
  "salt_enc": [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160],
  "kdf": {
    "iterations": 3,
    "memorySize": 65536,
    "parallelism": 1,
    "hashLength": 32
  },
  "encrypted_vault_key": {
    "iv": "MTIzNDU2Nzg5MDEyMzQ1Ng==",
    "ciphertext": "ZW5jcnlwdGVkLXZhdWx0LWtleS1nb2VzLWhlcmU="
  }
}
```

Response `201`:

```json
{ "message": "User registered successfully", "user_id": "<uuid>" }
```

### Login

```json
{
  "email": "user@example.com",
  "auth_key": "9f8e7d6c5b4a3928171605f4e3d2c1b0a9988776655443322110ffeeddccbbaa"
}
```

Response `200` (no MFA):

```json
{
  "access_token": "<jwt>",
  "token_type": "bearer",
  "expires_in": 3600,
  "encrypted_vault_key": { "iv": "...", "ciphertext": "..." }
}
```

### Create vault item

Password and notes are encrypted together in `encrypted_blob` on the frontend.

```json
{
  "website_name": "GitLab",
  "website_url": "https://gitlab.com",
  "username": "user.dev",
  "encrypted_blob": "Z2l0bGFiOmNpcGhlcnRleHQ=",
  "iv": "Z2l0bGFiOml2"
}
```

Response `201` includes `id`, metadata fields, `created_at`, and `last_used_at`.
