# EPIC Echo

**A content intelligence layer for any institution sitting on dormant expertise.**

EPIC Echo transforms founder talks into editor-ready content briefs across LinkedIn, X (Twitter), Instagram Carousel, and Short-form Video — scored transparently on a 6-axis rubric, with one-click publishing handoff.

Built for **MAD Fellowship 2026** on top of EPIC Lab's archive of founder talks from Plenna, Penta, Palenca, Clip, and more.

---

## The Why

EPIC Lab has hundreds of hours of founder wisdom locked in YouTube videos with triple-digit view counts. The problem is not the content — the problem is **distribution bandwidth**.

A 7-person team cannot watch 45-minute talks, extract the 3 moments that would stop a scroll on LinkedIn, rewrite them for Instagram carousels, and repeat this for 50+ recordings.

> **14 hours of manual work → 15 minutes with EPIC Echo.**

EPIC Echo is a **content intelligence layer**, not a content generator. It processes source talks into editor-ready briefs and preserves founder wisdom with source citations and timestamp links back to the exact moment in the video. The human editor stays in the loop. We output briefs and structured packs — never finished media.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Vercel (Frontend)                        │
│   Next.js 15 App Router · TypeScript · Tailwind · shadcn/ui │
│                                                              │
│   /              → Landing (3 talk cards)                    │
│   /talks/[id]    → Editorial Board (kanban + Resonance Meter)│
│   /voice-pack    → Voice Pack showcase                       │
│   /about         → Architecture + thesis + roadmap           │
│                                                              │
│   Brief Drawer   → Sheet overlay                             │
│                     Video player + score + publish buttons    │
│                                                              │
│   Data: reads directly from Supabase (anon key, RLS off)    │
└──────────────────────────┬──────────────────────────────────┘
                           │ reads
                           ▼
┌─────────────────────────────────────────────────────────────┐
│               Supabase (Postgres + pgvector)                 │
│                                                              │
│   talks │ insights │ briefs │ voice_pack                     │
│   trend_matches │ source_posts                               │
│                                                              │
│   pgvector: cosine similarity on insights.embedding (1536d)  │
└──────────────────────────┬──────────────────────────────────┘
                           ▲ writes (service role key)
                           │
┌─────────────────────────────────────────────────────────────┐
│            Local Python Pipeline (dev only)                  │
│                                                              │
│   run_pipeline.py orchestrates:                              │
│     ingest_talk()   → yt-dlp → Whisper → extract → embed    │
│     forge_briefs()  → generate × score × save               │
│     extract_voice() → structural + semantic analysis         │
│     check_trends()  → embed → vector match → bridge post     │
│                                                              │
│   Azure OpenAI: whisper, gpt-4o, text-embedding-3-small     │
│   All calls via Pydantic structured outputs (json_schema)   │
└─────────────────────────────────────────────────────────────┘
```

**Key principle:** The frontend reads from Supabase directly. The Python pipeline only runs locally during development. The demo runs entirely off pre-cached Supabase data — no backend cold starts, no CORS, no deploy config.

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Vercel |
| **Database** | Supabase, Postgres, pgvector (ivfflat index, 1536-dim embeddings) |
| **AI / LLM** | Azure OpenAI — gpt-4o, Whisper, text-embedding-3-small; Pydantic structured outputs |
| **Pipeline** | Python 3.11, FastAPI, yt-dlp, asyncio, Semaphore concurrency |

---

## Setup

### Prerequisites

- Node.js 20+
- Python 3.11+
- A Supabase project with the schema applied (see `supabase/schema.sql`)
- Azure OpenAI credentials (endpoint + API key)

### 1. Environment variables

**Backend** — copy `.env.example` to `backend/.env` and fill in:

```env
AZURE_OPENAI_ENDPOINT=https://your-deployment.openai.azure.com/
AZURE_OPENAI_API_KEY=your-api-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Frontend** — copy `.env.example` to `frontend/.env.local` and fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 2. Apply the Supabase schema

In the Supabase Dashboard → SQL Editor → New Query, paste and run the contents of `supabase/schema.sql`. This creates all tables, enums, pgvector indexes, and the `match_insights` RPC.

### 3. Run the Python pipeline

```bash
cd backend

# First-time setup
python -m venv .venv
source .venv/Scripts/activate   # Windows (bash)
# source .venv/bin/activate     # macOS / Linux
pip install -r requirements.txt

# Ingest a talk (processes audio → transcript → insights → embeddings)
python scripts/run_pipeline.py --talk 1

# Extract the Voice Pack from seeded social posts
python scripts/run_pipeline.py --voice

# Forge + score all briefs (748 briefs for 3 talks)
python scripts/run_pipeline.py --forge

# Run the Trend Hijacker (matches headlines to insights, generates bridge posts)
python scripts/run_pipeline.py --trends

# Seed the Time Machine card
python scripts/run_pipeline.py --time-machine
```

> **Rate limit note:** All models share a single Azure OpenAI deployment. The forge pipeline uses `Semaphore(2)` + 0.6s pacing. Do not run `--forge` and `--trends` simultaneously. If you hit a 429, wait 60 seconds for the per-minute window to reset.

### 4. Start the frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

---

## Pipeline Stages

| Step | Name | What it does |
|------|------|-------------|
| 1 | **Ingest** | `yt-dlp` downloads YouTube audio; Azure Whisper transcribes with word-level timestamps |
| 2 | **Extract** | Speaker-turn chunks sent to gpt-4o with strict JSON schema; each insight includes claim, evidence, speaker quote, timestamps, and journey stages |
| 3 | **Embed** | 1536-dim embeddings stored in Supabase pgvector; powers cosine similarity search |
| 4 | **Voice Pack** | 63 real EPIC Lab posts analysed — structural pass (pure Python: word counts, emoji density, openers) + semantic pass (gpt-4o: tone, hook patterns, banned phrases) |
| 5 | **Forge + Score** | Each insight × relevant journey stages × 4 platforms. Every brief scored on 6 axes. Average score: 79/100 across 748 briefs |
| 6 | **Trend Hijacker** | Trending headlines embedded and matched to insights via cosine similarity (threshold 0.50). Bridge posts generated in EPIC Lab's voice |
| 7 | **Time Machine** | Hand-curated 'Then & Now' card connecting a 2023 Adolfo Babatz prediction to the Clip unicorn outcome |

---

## What's Real vs. What's Hardcoded

| Feature | Status | Notes |
|---------|--------|-------|
| Pipeline (ingest → extract → embed → forge → score) | ✅ Real | Fully reproducible. Run `run_pipeline.py` with your own YouTube URLs |
| Voice Pack analysis | ✅ Real | 63 real EPIC Lab posts seeded; structural + semantic passes fully run |
| pgvector similarity search | ✅ Real | `match_insights` RPC with ivfflat index, cosine distance |
| Scoring rubric (6-axis, 0–100) | ✅ Real | gpt-4o with strict JSON schema; no fake numbers |
| Demo talks (3 talks) | ✅ Real | However, they were hand-picked to represent distinct domains: leadership, fintech, marketing |
| Trend headlines (2 headlines) | Seeded | Chosen to match processed talks; in `seeds/trend_headlines.json` |
| Time Machine card (1 card) | Seeded | The Clip unicornio case; in `seeds/time_machine.json` |


---

## How AI Was Used to Build This

This project was built almost entirely with AI assistance, end-to-end. Here is the honest breakdown:

| Phase | Tools Used |
|-------|-----------|
| **Research & scoping** | Scraped EPIC Lab's website and YouTube channel with **Firecrawl**; analysed structure and content with **Gemini 3.1 Pro** to understand the product's context and voice |
| **Video analysis** | Initial analysis of talk transcripts and EPIC Lab's posting patterns with **Gemini 3.1 Pro** to identify what types of insights surface best |
| **Scraping Posts** | Scraping posts and captions from the EPIC Lab's social media accounts to analyze language with **Claude Chrome Desktop Plugin** to recreate a genuine and accurate EPIC Lab's voice |
| **Architecture & brainstorming** | Designed the full system (pipeline stages, data model, API contracts, frontend routes) in **Claude Projects** with **Claude Opus 4.6**, using the `/plan`, `/superpowers`, `/brainstorm`, and `/claude-api` skills to stress-test decisions before writing a line of code |
| **Building** | All code — backend pipeline, frontend, Supabase schema, prompts, scoring rubric — written with **Claude Code** (Sonnet 4.6) and **OpenAI Codex** |
| **Deployment** | Frontend deployed to **Vercel** (zero-config Next.js); database on **Supabase** (Postgres + pgvector); no server to manage |
| **LLM inference (runtime)** | All production LLM calls go through **Azure OpenAI** — gpt-4o for extraction, scoring, and voice analysis; Whisper for transcription; text-embedding-3-small for vector embeddings |

The pipeline logic, scoring rubric, voice analysis, and vector search architecture were all designed with AI assistance — but every design decision was reviewed, tested against real data, and adjusted based on observed results (e.g., lowering the similarity threshold from 0.70 to 0.50 after empirically confirming that founder talks and news articles occupy different embedding neighborhoods).

---

## MAD Fellowship 2026

EPIC Echo was built as a fellowship project for **MAD Fellowship 2026**, applying content intelligence techniques to EPIC Lab — a Mexico City-based founder ecosystem at ITAM.

The closing thesis: *EchoStudio — a content intelligence layer for any institution sitting on dormant expertise.* EPIC Lab is the first use case. Any university, accelerator, or media organization with a back-catalog of expert talks faces the same problem.

---

> *"The intelligence was always in the talks. We just built the layer to surface it."*
>
> EPIC Echo · MAD Fellowship 2026
