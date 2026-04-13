# EPIC Echo — Architecture

## System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Vercel (Frontend)                        │
│   Next.js 15 App Router + TypeScript + Tailwind + shadcn/ui │
│                                                              │
│   /              → Landing (3 talk cards)                    │
│   /talks/[id]    → Editorial Board (kanban + Resonance Meter)│
│   /voice-pack    → Voice Pack showcase                       │
│   /about         → Architecture + thesis + roadmap           │
│                                                              │
│   Brief Drawer   → Side panel overlay (Sheet component)      │
│                     Video player + score + publish buttons    │
└──────────────────────────┬──────────────────────────────────┘
                           │ reads (anon key, RLS off for demo)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│               Supabase (Postgres + pgvector)                 │
│                                                              │
│   talks │ insights │ briefs │ voice_pack                     │
│   trend_matches │ source_posts                               │
│                                                              │
│   pgvector: cosine similarity on insights.embedding (1536d)  │
│   RLS: OFF (demo mode — no auth)                             │
└──────────────────────────┬──────────────────────────────────┘
                           ▲ writes (service role key)
                           │
┌─────────────────────────────────────────────────────────────┐
│            Local Python Pipeline (dev only)                   │
│                                                              │
│   scripts/run_pipeline.py orchestrates:                      │
│     ingest_talk()  → yt-dlp → Whisper → extract → embed     │
│     forge_briefs() → generate × score × save                 │
│     extract_voice_pack() → structural + semantic             │
│     check_trends() → embed → match → bridge                  │
│                                                              │
│   Azure OpenAI: whisper, gpt-4o, gpt-4o-mini,               │
│                 text-embedding-3-small                        │
│   Endpoint: https://gpt-4o-epic.openai.azure.com/            │
│   All calls: Pydantic + structured outputs (json_schema)     │
└─────────────────────────────────────────────────────────────┘
```

## Key Data Flow Principle

```
Frontend  →  Supabase  (direct, read-only, anon key)
Pipeline  →  Supabase  (write, service role key)
Frontend  ✗  Python backend  (NEVER — no direct calls)
```

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 15 (App Router) | SSR/SSG routing |
| Styling | Tailwind CSS v4 + shadcn/ui | Component system |
| State | React Server Components + client hooks | No Redux |
| Database | Supabase (Postgres 15) | Primary data store |
| Vectors | pgvector (IVFFLAT, cosine) | Semantic search |
| LLM | Azure OpenAI | gpt-4o, gpt-4o-mini, whisper, embeddings |
| Pipeline | Python 3.11 + FastAPI | Local-only runner |
| Data validation | Pydantic v2 | Backend; TypeScript interfaces: Frontend |
| PDF | jspdf (client-side) | Instagram carousel export |
| Video | react-player | YouTube embed with seek |
| Deploy | Vercel | Frontend only |

## Database Schema

```
talks          ← source YouTube videos
  └── insights ← extracted knowledge units (with 1536-dim embeddings)
        └── briefs ← generated editor-ready content
              ↑
         platform (linkedin/x/instagram_carousel/short_form_video)
         journey_stage (curious_explorer/first_builder/growth_navigator/ecosystem_leader)
         resonance_score (0-100 composite)
         score_breakdown (6 axes: hook, evidence, voice, format, stage, novelty)

voice_pack     ← EPIC Lab brand voice (1 row: structural + semantic profiles)
trend_matches  ← matched insights to trending headlines
source_posts   ← raw EPIC Lab posts used to build voice pack
```

## Resonance Score (6-Axis Rubric)

| Axis | What it measures | Weight |
|------|-----------------|--------|
| Hook Strength | Does the first line stop the scroll? | 1/6 |
| Evidence Density | Specific claim + specific support? | 1/6 |
| Voice Conformance | Matches EPIC Lab voice pack? | 1/6 |
| Platform-Format Fit | Uses platform's native format correctly? | 1/6 |
| Journey Stage Clarity | Obvious who this is for? | 1/6 |
| Novelty | Says something new vs. prior content? | 1/6 |

Composite = `round(mean(6 axes) × 10)` → 0-100

## Cost Estimate (Full Pipeline)

| Step | Model | Est. Cost |
|------|-------|----------|
| Transcription (3 talks) | whisper | ~$0.81 |
| Insight extraction | gpt-4o | ~$1.50 |
| Embeddings | text-embedding-3-small | ~$0.01 |
| Voice pack semantic | gpt-4o | ~$0.15 |
| Brief generation (~240) | gpt-4o-mini | ~$0.40 |
| Brief scoring (~240) | gpt-4o-mini | ~$0.25 |
| Trend bridge posts (2) | gpt-4o-mini | ~$0.01 |
| **Total** | | **~$3.13** |
