# Backend (FastAPI)

FastAPI service providing adaptive exercise items and tracking user progress with SQLite.

## Requirements

* Python ≥ 3.10

## Setup

**Windows (PowerShell):**

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install fastapi "uvicorn[standard]" sqlmodel pydantic python-dotenv openai==1.*
# .env — choose one option below
"MOCK_MODE=1`nDB_URL=sqlite:///./aphasia.db`nOPENAI_MODEL=gpt-4o-mini" | Out-File -Encoding utf8 .env
# or
# "OPENAI_API_KEY=sk-...`nDB_URL=sqlite:///./aphasia.db`nOPENAI_MODEL=gpt-4o-mini" | Out-File -Encoding utf8 .env
uvicorn main:app --reload --port 8000
```

**macOS/Linux:**

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install fastapi "uvicorn[standard]" sqlmodel pydantic python-dotenv openai==1.*
cat > .env << 'EOF'
MOCK_MODE=1
DB_URL=sqlite:///./aphasia.db
OPENAI_MODEL=gpt-4o-mini
EOF
# or provide OPENAI_API_KEY in the .env instead of MOCK_MODE
uvicorn main:app --reload --port 8000
```

SQLite DB file `aphasia.db` is created automatically at first run.

## Environment Variables

* `MOCK_MODE=1` — generate mock items without external API calls
* `OPENAI_API_KEY=sk-…` — enables OpenAI-powered generation (if `MOCK_MODE` is not set to `1`)
* `OPENAI_MODEL` — defaults via env; examples: `gpt-4o-mini`
* `DB_URL` — SQLModel connection string (default `sqlite:///./aphasia.db`)

## CORS

Dev CORS allows `http://localhost:5173`. Update `allow_origins` in `main.py` for other environments.

## Endpoints

* `POST /api/next` — Get next batch (5) of items for an exercise
* `POST /api/attempt` — Record an attempt (accuracy, latency, level)
* `GET /api/progress` — Return EMA stats per exercise for a user

**Example:**

```bash
curl -X POST http://localhost:8000/api/next \
  -H 'Content-Type: application/json' \
  -d '{"user_id":"dev","exercise":"prepositions","options":{}}'
```

## Adaptive Logic (high level)

* **EMA accuracy/latency** (α = 0.3)
* **Streaks** increase/decrease difficulty levels (1–5)
* Exercise parameters (e.g., blanks, passage length, speech strictness) scale with level

## Production

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 2
```

Use systemd or a process manager and place the app behind a reverse proxy.

## Resetting Data

Delete `aphasia.db` (SQLite) to reset local data:

```bash
deactivate || true
rm -f aphasia.db  # or del aphasia.db on Windows
```

---