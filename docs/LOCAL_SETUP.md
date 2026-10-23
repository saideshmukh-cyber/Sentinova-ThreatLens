# Local setup and replacement procedure

## 1. Back up the current project

Before replacing anything, commit your current working state:

```bash
git status
git add .
git commit -m "chore: backup before complete implementation"
```

If you have uncommitted work that you do not want committed yet, make a copy of the project folder first.

## 2. Replace files

Do not blindly delete your whole project.

Copy the contents of this package into your existing `Sentinova ThreatLens` project and allow the files in the package to replace matching files. The package contains your existing application plus the new implementation.

The most important changed files are:

- `backend/app/api/auth.py`
- `backend/app/schemas/auth.py`
- `backend/app/services/auth_service.py`
- `backend/app/models/user.py`
- `backend/app/auth_middleware.py`
- `backend/app/api/websocket.py`
- `backend/app/websocket/manager.py`
- `backend/app/services/realtime_bus.py`
- `backend/app/services/realtime_service.py`
- `backend/app/services/alert_service.py`
- `backend/app/main.py`
- `backend/alembic/versions/f2a7b8c9d0e1_harden_user_authentication.py`
- `frontend/src/app/login/page.tsx`
- `frontend/src/app/signup/page.tsx`
- `frontend/src/components/SocShell.tsx`
- `frontend/src/lib/api.ts`
- `frontend/src/lib/websocket.ts`
- `frontend/eslint.config.mjs`

## 3. Start the backing services

```bash
docker compose up -d postgres redis elasticsearch
docker compose ps
```

Wait until PostgreSQL, Redis and Elasticsearch are healthy/running.

## 4. Backend

```bash
source .venv/Scripts/activate
pip install -r backend/requirements.txt
alembic -c backend/alembic.ini upgrade head
python -m uvicorn backend.app.main:app --reload
```

On Git Bash/Windows, if `source` is not accepted, use the activation command appropriate to your shell.

## 5. Frontend

Open a second terminal:

```bash
cd frontend
npm ci
npm run dev
```

Open `http://localhost:3000`.

## 6. First login

Use the bootstrap admin credentials from `.env` or create a new Analyst account through `/signup`.

Self-signup deliberately creates only the `analyst` role. Privileged roles should be assigned by an administrator.
