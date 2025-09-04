# Aphasia Trainer (React + FastAPI)

A web app to help people with aphasia practice speech and comprehension.

- Frontend: **React + Vite + Tailwind v4**
- Backend: **FastAPI + SQLite**, adaptive difficulty (EMA accuracy/latency + streaks)
- Content: generated in **batches of 5** (mock mode available, no key required)

---

## Features

- **Speech Match** — speak or type to match a phrase (lenient WER-like scoring)
- **Prepositions** — drag & drop the correct prepositions into blanks
- **Sentence T/F** — read/listen to a short passage and answer true/false
- **Adaptive difficulty** — levels 1–5 based on EMA accuracy, EMA latency, and streaks
- **Progress panel** — shows level, EMA accuracy/latency, attempts, streak
- **Batching** — each request returns 5 items; UI prefetches to reduce latency
- **Mock mode** — develop without an OpenAI API key

---

## Prerequisites

- **Node.js** ≥ 18  
- **Python** ≥ 3.10  
- (Windows) PowerShell recommended
- (Optional) OpenAI API key

---

