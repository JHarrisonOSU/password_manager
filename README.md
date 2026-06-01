# Password Protector

Password Protector is a full-stack secure password manager built with a
React/Vite frontend, FastAPI backend, and Supabase Postgres database. The app is
designed around a zero-knowledge style workflow: the user's master password is
not sent to the backend, and saved password details are encrypted in the browser
before they are stored.

## Features

- Account registration and login with client-side Argon2id key derivation
- Optional TOTP multi-factor authentication
- JWT-protected authenticated routes
- Encrypted vault item creation, viewing, editing, and deletion
- Password visibility toggles and copy-to-clipboard controls
- Password generator for new vault entries
- Search and alphabetical sorting by website name or URL
- Vault unlock flow after page refresh without persisting the vault key
- Responsive public pages, authenticated dashboard layout, and documentation page

## Architecture

```text
password_manager/
├── frontend/        # React + Vite app
├── backend/         # FastAPI JSON API
├── db/              # Database schema/reference files
└── README.md        # Project overview
```

### Frontend

The frontend handles the user interface and client-side cryptography. It
derives login/encryption keys from the master password, encrypts vault secrets
with AES-GCM, and sends only encrypted password details to the backend.

Primary frontend stack:

- React
- Vite
- React Router
- hash-wasm for Argon2id
- lucide-react icons
- qrcode.react for MFA setup QR codes

### Backend

The backend exposes a FastAPI API for auth, MFA, and vault persistence. It
stores authentication metadata, salts, KDF parameters, encrypted vault keys, and
encrypted vault item blobs. It does not need plaintext vault passwords.

Primary backend stack:

- FastAPI
- Supabase Python client
- Pydantic settings/schemas
- JWT auth
- TOTP MFA support

### Database

The project uses Supabase Postgres for user and vault item storage. Vault rows
are tied to the authenticated user. The backend uses protected endpoints and
user-scoped queries; Supabase row-level security can be used as an additional
database-side protection layer depending on deployment configuration.

## Security Model

At a high level:

1. The user enters a master password in the browser.
2. The frontend derives an authentication key and an encryption key.
3. The backend verifies the authentication key, but never receives the raw
   master password.
4. The frontend decrypts the user's vault key locally.
5. Saved password details and notes are encrypted before being sent to the API.
6. Searchable metadata, such as website name, website URL, and username, is
   stored separately so the vault can be searched without decrypting every row.

The in-memory vault key is intentionally not persisted. If the page refreshes,
the user can remain signed in with a token, but must re-enter the master
password before viewing or editing encrypted password details.

## Local Setup

### Prerequisites

- Node.js and npm
- Python 3.12+
- A Supabase project
- Backend environment values from Supabase

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Fill in `backend/.env`:

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
JWT_SECRET=
JWT_ALGORITHM=HS256
JWT_EXPIRES_MINUTES=60
CORS_ORIGINS= (ex. "http://localhost:5173" or frontend host url)
```

Generate a development JWT secret:

```bash
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

Start the backend:

```bash
uvicorn app.main:app --reload --port 8000
```

Useful backend URLs:

- API docs: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`
- Health check: `http://127.0.0.1:8000/health`

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
```

Fill in `frontend/.env`:

```env
VITE_API_BASE_URL= (ex. "http://127.0.0.1:8000" or backend host url)
VITE_SHOW_DEBUG_TOOLS=false
```

Start the frontend:

```bash
npm run dev
```

If running in a remote development environment such as Codespaces, expose the
dev server with:

```bash
npm run dev -- --host 0.0.0.0
```

## Common Development Commands

Frontend:

```bash
cd frontend
npm run lint
npm run build
```

Backend:

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

## Demo Flow

1. Register a new account with a strong master password.
2. Log in and enter the vault.
3. Add a password with website name, website URL, account login, password, and
   optional notes.
4. Search the vault by website name or URL.
5. Open a credential, reveal/copy the password, edit the entry, or delete it.
6. Refresh the page and unlock the vault again with the master password.
7. Open Account Settings and enable MFA with an authenticator app.

## Deployment

The project has been structured for:

- Frontend deployment on Vercel
- Backend deployment on Railway
- Database hosting on Supabase

For production-style deployment:

1. Set `VITE_API_BASE_URL` in Vercel to the backend's Railway URL.
2. Set backend environment variables in Railway.
3. Add the deployed frontend origin to backend `CORS_ORIGINS`.
4. Keep Supabase service-role keys server-side only.

## Notes For Reviewers

- The frontend intentionally performs encryption/decryption before API calls.
- The backend stores encrypted vault data and user-scoped metadata.
- The vault key is stored in memory only, not localStorage.
- The project includes a user guide page explaining vault usage, MFA, and the
  client-side encryption flow.
- More detailed backend API notes are available in `backend/README.md`.
