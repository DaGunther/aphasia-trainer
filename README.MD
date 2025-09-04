# README.MD (root)

# Aphasia Trainer (React + FastAPI)

A web app to help people with aphasia practice speech and comprehension.

* **Frontend:** React + TypeScript + Vite + Tailwind v4
* **Backend:** FastAPI + SQLite with adaptive difficulty (EMA accuracy/latency + streaks)
* **Content:** Items are delivered in **batches of 5**; a **mock mode** lets you develop without an OpenAI key

---

## Quick Start (local dev)

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

**macOS/Linux (bash/zsh):**

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

The API will be available at **[http://localhost:8000](http://localhost:8000)**.

### 2) Frontend

In a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Open **[http://localhost:5173](http://localhost:5173)**. The Vite dev server **proxies** `/api` to `http://localhost:8000` (see `vite.config.ts`).

> **Microphone:** Speech Matching uses the Web Speech API. It works best in Chrome/Edge desktop. Allow microphone access in the browser.

---

## Repository Layout

```
└── dagunther-aphasia-trainer/
    ├── README.MD                # Project overview & quick start
    ├── backend/
    │   ├── README.MD            # API setup, env, endpoints, tips
    │   └── main.py              # FastAPI app
    └── frontend/
        ├── README.md            # Frontend usage & scripts
        ├── …                    # Vite/React/Tailwind project
```

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

Place a `.env` file in `backend/`:

```
# Option A: no key required
MOCK_MODE=1
DB_URL=sqlite:///./aphasia.db
OPENAI_MODEL=gpt-4o-mini

# Option B: use OpenAI
# OPENAI_API_KEY=sk-...
# DB_URL=sqlite:///./aphasia.db
# OPENAI_MODEL=gpt-4o-mini
```

* `MOCK_MODE=1` returns deterministic sample items (no external calls)
* `DB_URL` points to the SQLite file (created automatically)
* `OPENAI_MODEL` is used when `OPENAI_API_KEY` is present and `MOCK_MODE` is not `1`

### Frontend env

* During dev, the frontend **does not need** env vars; it proxies `/api` to `http://localhost:8000`.
* For custom backends, you can set `VITE_API_BASE` (overrides the proxy) and the app will call `${VITE_API_BASE}/api`.

---

## API Surface (dev reference)

* `POST /api/next` — get next batch for an exercise

  * Body: `{ user_id, exercise: "speech"|"prepositions"|"sentence_tf", options:{} }`
* `POST /api/attempt` — record an attempt

  * Body: `{ user_id, exercise, item_id?, correct, latency_ms?, difficulty_level? }`
* `GET /api/progress?user_id=…` — current EMA stats per exercise

**Quick cURL:**

```bash
curl -X POST http://localhost:8000/api/next \
  -H 'Content-Type: application/json' \
  -d '{"user_id":"dev","exercise":"speech","options":{}}'
```

---

## Build & Production

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

Use a reverse proxy (e.g., nginx) and enable HTTPS for production.

---

## Troubleshooting

* **CORS**: Dev CORS allows `http://localhost:5173` (see `main.py`). If your frontend runs elsewhere, add its origin.
* **No items appear**: Ensure the backend is running on port **8000** before starting the frontend.
* **Speech not working**: Check browser permissions and use Chrome/Edge (Safari/Firefox may lack Web Speech API).
* **Styling looks plain**: Restart `npm run dev` and ensure `@import "tailwindcss";` is present in `src/index.css`.

---

# frontend/README.md

# Frontend (React + TypeScript + Vite + Tailwind v4)

Single-page app with three exercises and a progress panel. Talks to the FastAPI backend via `/api`.

## Prerequisites

* Node.js ≥ 18

## Install & Run (dev)

```bash
cd frontend
npm install
npm run dev
# open http://localhost:5173
```

The dev server proxies `/api` to `http://localhost:8000` (see `vite.config.ts`). Start the backend first.

## Available Scripts

* `npm run dev` — start Vite dev server
* `npm run build` — type-check + production build into `dist/`
* `npm run preview` — local preview of the production build
* `npm run lint` — run ESLint (TypeScript + React Hooks rules)

## Environment (optional)

By default, API calls go to `/api` (proxied). To hit a remote backend directly:

```bash
# .env.local
VITE_API_BASE=https://your-backend.example.com
```

## App Overview

* **Speech Match** — speak or type to match the prompt. Uses Web Speech API; shows coverage & WER-like feedback.
* **Prepositions** — drag words (e.g., in/on/at…) into blanks.
* **Sentence T/F** — read/listen to a short passage and answer true/false.
* **Progress Panel** — fetches EMA stats from the backend.
* **Batch Summary** — after every 5 answers, shows accuracy, avg latency, and level changes.

## Styling

* Tailwind v4 is already set up. If styles don’t apply, ensure `@import "tailwindcss";` is present in `src/index.css` and restart `npm run dev`.

## Accessibility & Browser Notes

* **Microphone:** allow access in the browser to use Speech Match.
* **Web Speech API:** best in Chrome/Edge desktop. Safari/Firefox support is limited.
* Keyboard users can complete all tasks (drag targets also have focusable drop zones with Enter/Space via mouse emulation).

## Building for Production

```bash
npm run build
# deploy the contents of dist/ to any static host
```

For local testing:

```bash
npm run preview
```

## Common Issues

* **“Failed to fetch”** — backend not running on port 8000 or proxy changed.
* **CORS error** — update `allow_origins` in backend `main.py` if serving the frontend from a different origin.
* **No microphone input** — check site permissions, use a supported browser.
