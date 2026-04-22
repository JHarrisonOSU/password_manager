# SPM Backend (FastAPI)

Backend for the **Secure Password Manager** project. Exposes a small JSON API
that the React/Vite frontend talks to. The backend **never sees plaintext
vault data** — encryption/decryption happens on the frontend. The backend's
job is:

1. Authenticate users (email + master password → bcrypt hash + JWT)
2. Store and serve opaque `encrypted_blob` + `iv` rows for vault items
3. Enforce that a user can only access their own vault items

## Project layout

```
password_manager/backend/
├── app/
│   ├── main.py              # FastAPI app factory, CORS, router mounting
│   ├── config.py            # Pydantic settings loaded from .env
│   ├── db.py                # Supabase client (service role)
│   ├── security.py          # bcrypt + JWT helpers
│   ├── deps.py              # Dependency: current authenticated user
│   ├── routers/
│   │   └── auth.py          # POST /auth/register, /auth/login, GET /auth/me
│   └── schemas/
│       └── auth.py          # Request/response Pydantic models
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
# Then fill in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET in .env
```

Generate a strong `JWT_SECRET`:

```bash
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

## Run

```bash
uvicorn app.main:app --reload --port 8000
```

- Swagger UI: http://localhost:8000/docs
- ReDoc:      http://localhost:8000/redoc
- Health:     http://localhost:8000/health

## API

### `POST /auth/register`
Request:
```json
{ "email": "alice@example.com", "master_password": "example-passphrase" }
```
Response `201`:
```json
{ "id": "uuid", "email": "alice@example.com", "mfa_enabled": false }
```
Errors: `409` if email already exists.

### `POST /auth/login`
Request:
```json
{ "email": "alice@example.com", "master_password": "example-passphrase" }
```
Response `200`:
```json
{ "access_token": "<jwt>", "token_type": "bearer", "expires_in": 3600 }
```
Errors: `401` on bad credentials.

### `GET /auth/me`
Header: `Authorization: Bearer <jwt>`
Response `200`:
```json
{ "id": "uuid", "email": "alice@example.com", "mfa_enabled": false }
```
