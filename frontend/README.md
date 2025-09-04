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