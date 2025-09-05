# Aphasia Trainer (React + FastAPI)

A web app to help people with aphasia practice speech and comprehension.

* **Frontend:** React + TypeScript + Vite + Tailwind v4
* **Backend:** FastAPI + SQLite with adaptive difficulty (EMA accuracy/latency + streaks)
* **Content:** Items are delivered in **batches of 5**; a **mock mode** lets you develop without an OpenAI key

---

## Quick Start — Local Dev

> Requires **Node.js ≥ 18** and **Python ≥ 3.10**.

### 1) Backend

Create and activate a virtual environment, install deps, set env, and run the API.

**Windows (PowerShell):**

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install fastapi "uvicorn[standard]" sqlmodel pydantic python-dotenv openai==1.*
# Either use MOCK_MODE (no key)…
"MOCK_MODE=1`nDB_URL=sqlite:///./aphasia.db`nOPENAI_MODEL=gpt-4o-mini" | Out-File -Encoding utf8 .env
# …or provide your OpenAI key
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
# Either use MOCK_MODE (no key)…
cat > .env << 'EOF'
MOCK_MODE=1
DB_URL=sqlite:///./aphasia.db
OPENAI_MODEL=gpt-4o-mini
EOF
# …or provide your OpenAI key
# cat > .env << 'EOF'
# OPENAI_API_KEY=sk-...
# DB_URL=sqlite:///./aphasia.db
# OPENAI_MODEL=gpt-4o-mini
# EOF
uvicorn main:app --reload --port 8000
```

API: **[http://localhost:8000](http://localhost:8000)**

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

App: **[http://localhost:5173](http://localhost:5173)** (Vite dev server proxies `/api` → `http://localhost:8000`).

> **Microphone:** Speech Matching uses the Web Speech API. Use Chrome/Edge desktop and allow mic access.

---

## Quick Start — Docker / Compose

This repo includes a production-style container setup (Nginx serves the built frontend and **proxies `/api` → FastAPI**).

```bash
# Build and start
docker compose up -d --build

# Logs
docker compose logs -f api
docker compose logs -f web
```

Open **[http://localhost:8080](http://localhost:8080)** for the web UI.
The backend is also published on **[http://localhost:8000](http://localhost:8000)** for direct testing.

**Environment for Docker (backend):**
Create `backend/.env` (don’t commit secrets):

```
# Option A: no key required (recommended to verify first run)
MOCK_MODE=1
DB_URL=sqlite:////data/aphasia.db   # container path; persisted via volume
OPENAI_MODEL=gpt-4o-mini

# Option B: use OpenAI (then unset MOCK_MODE)
# OPENAI_API_KEY=sk-...
# DB_URL=sqlite:////data/aphasia.db
# OPENAI_MODEL=gpt-4o-mini
```

> When running in Docker **do not set `VITE_API_BASE`**. The built frontend calls `/api`, which Nginx proxies to the `api` service. If you previously built with a custom `VITE_API_BASE`, rebuild the image.

**Sanity checks:**

```bash
# From your host:
curl "http://localhost:8000/api/progress?user_id=dev"

# Through Nginx proxy (web UI origin):
curl "http://localhost:8080/api/progress?user_id=dev"
```

---

## Repository Layout

```
└── dagunther-aphasia-trainer/
    ├── README.md
    ├── docker-compose.yml                  # web (nginx) + api (fastapi) + volume for sqlite
    ├── .dockerignore
    ├── Dockerfile.api                      # builds the FastAPI image (copies backend/)
    ├── Dockerfile.web                      # builds frontend then serves via nginx
    ├── backend/
    │   ├── .env                            # see env section above (not committed)
    │   ├── README.md
    │   └── main.py
    └── frontend/
        ├── nginx.conf                      # proxies /api to http://api:8000
        ├── README.md
        ├── (Vite/React/Tailwind project files…)
```

> If your Dockerfiles are named differently in your repo, update the paths in `docker-compose.yml` accordingly.

---

## Features

* **Speech Match** — speak or type to match a phrase (lenient WER-like scoring)
* **Prepositions** — drag & drop prepositions into blanks
* **Sentence True/False** — read or listen to a short passage and answer
* **Adaptive difficulty** — levels 1–5 via EMA accuracy, EMA latency, and streaks
* **Progress panel** — shows level, EMA accuracy/latency, attempts, streak
* **Batching** — each `/api/next` returns **5** items; UI prefetches the next batch
* **Mock mode** — develop without an OpenAI API key

---

## Configuration

### Backend `.env`

```
# Option A: no key required
MOCK_MODE=1
DB_URL=sqlite:///./aphasia.db           # local dev
# DB_URL=sqlite:////data/aphasia.db     # docker container path
OPENAI_MODEL=gpt-4o-mini

# Option B: use OpenAI
# OPENAI_API_KEY=sk-...
# DB_URL=sqlite:///./aphasia.db
# OPENAI_MODEL=gpt-4o-mini
```

* `MOCK_MODE=1` returns deterministic sample items (no external calls).
* `DB_URL` is the SQLModel connection string. Use the **container path** when in Docker.
* `OPENAI_MODEL` is used only when `OPENAI_API_KEY` is present and `MOCK_MODE` ≠ `1`.

### Frontend env

* **Local dev:** no env needed; Vite proxies `/api` to `http://localhost:8000`.
* **Docker build:** do **not** set `VITE_API_BASE`; the app calls `/api` and Nginx proxies to the `api` service.

---

## API Surface (dev reference)

* `POST /api/next` — get next batch for an exercise
  Body: `{ user_id, exercise: "speech"|"prepositions"|"sentence_tf", options:{} }`
* `POST /api/attempt` — record an attempt
  Body: `{ user_id, exercise, item_id?, correct, latency_ms?, difficulty_level? }`
* `GET /api/progress?user_id=…` — current EMA stats per exercise

**Quick cURL:**

```bash
curl -X POST http://localhost:8000/api/next \
  -H 'Content-Type: application/json' \
  -d '{"user_id":"dev","exercise":"speech","options":{}}'
```

---

## Build & Production (without Docker)

### Frontend

```bash
cd frontend
npm run build
npm run preview   # serves dist/ locally
```

Host `frontend/dist/` on any static server.

### Backend

```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 2
```

Put a reverse proxy (e.g., Nginx) in front and enable HTTPS.

---

## Troubleshooting

* **Blank UI / “Failed to fetch” / `ERR_NAME_NOT_RESOLVED`**
  You’re likely calling `api:8000` from the browser. That hostname only exists inside the Docker network.
  **Fix:** In Docker, the frontend must call **`/api`** (Nginx proxies it). Rebuild the web image if you previously baked a `VITE_API_BASE`.

* **Backend 200 OK but empty progress**
  That’s normal on first run: `{"user_id":"dev","progress":[]}`. Once you answer items, rows appear.

* **OpenAI errors**
  Start with `MOCK_MODE=1`. When ready, set `OPENAI_API_KEY` and remove `MOCK_MODE`. Never commit keys.

* **SQLite path in Docker**
  Use `DB_URL=sqlite:////data/aphasia.db` (note the four slashes). The `/data` dir is a Docker volume.

* **CORS**
  Dev CORS allows `http://localhost:5173` (see `backend/main.py`). Adjust `allow_origins` for other dev origins.
  In Docker the browser hits Nginx on `:8080`, which proxies internally, so CORS is not involved.

---