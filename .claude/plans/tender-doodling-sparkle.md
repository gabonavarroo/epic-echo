# EPIC Echo — Master Build Plan

## Table of Contents
1. [Context & Thesis](#1-context--thesis)
2. [Decisions on Open Questions (§14)](#2-decisions-on-open-questions-14)
3. [Architecture Overview](#3-architecture-overview)
4. [Directory Structure](#4-directory-structure)
5. [Data Model (SQL DDL)](#5-data-model-sql-ddl)
6. [Block-by-Block Implementation](#6-block-by-block-implementation)
7. [Risks & Mitigations](#7-risks--mitigations)
8. [Prerequisites Checklist](#8-prerequisites-checklist)
9. [CLAUDE.md Specifications](#9-claudemd-specifications)
10. [.gitignore Updates](#10-gitignore-updates)

---

## 1. Context & Thesis

**The thesis in my own words**: EPIC Lab has hundreds of hours of founder wisdom locked in YouTube videos with triple-digit view counts. The problem isn't the content — the speakers are real founders who built Plenna, Penta, Palenca, suvi. The problem is distribution bandwidth: a 7-person team cannot watch 45-minute talks, extract the 3 moments that would stop a scroll on LinkedIn, rewrite them for Instagram carousels, and repeat this for 50+ recordings.

EPIC Echo is a **content intelligence layer** — not a content generator. It processes source talks into **editor-ready briefs** across 4 platforms, scored transparently on a 6-axis rubric, with one-click publishing handoff. The human editor goes from 14 hours of work to 15 minutes. We output briefs and structured packs (text + structure + source citations), never finished media. The human stays in the loop. This is non-negotiable.

The demo is a 3-minute pre-recorded video showing pre-cached results. Visual polish per pixel matters more than feature volume. The pipeline is real — the only thing pre-cached is the *results*, not the intelligence.

**Product name**: EPIC Echo (dashboard + demo). Closing 10 seconds tease: "EchoStudio — a content intelligence layer for any institution sitting on dormant expertise."

---

## 2. Decisions on Open Questions (§14)

### 2.1 Chunking Strategy → **Speaker-turn-based with semantic fallback**
- Primary split: speaker turns (natural boundaries in talks/interviews)
- Fallback: if a single turn exceeds ~400 tokens, split at sentence boundaries while preserving timestamp ranges
- **Why**: Speaker turns preserve conversational context. Timestamp accuracy is critical because every brief links back to the exact source moment. Fixed-token chunking risks splitting mid-thought and corrupting timestamps.
- Implementation: use `tiktoken` (cl100k_base) for token counting, sentence boundary detection via punctuation + regex

### 2.2 Insight Extraction Granularity → **~1 insight per 3-5 min, smart brief selection** ✅ CONFIRMED
- A 45-min talk → 9-15 insights per talk → ~30-45 insights across 3 talks
- **Brief count strategy**: NOT all 16 combinations per insight. Instead:
  - The extraction prompt tags each insight with its relevant `journey_stages[]` (typically 1-2 stages)
  - Forge generates briefs only for `(insight × tagged_stages × all_4_platforms)`
  - Result: ~10 insights × ~2 stages × 4 platforms = **~80 briefs per talk** ← hits the spec target
- This is efficient (fewer API calls) and produces higher-quality output (each brief is genuinely relevant to its stage)

### 2.3 Video Player → **Real react-player embed with timestamp seek**
- react-player handles YouTube URLs natively, `player.seekTo(seconds)` is a one-liner
- This is the "wow moment" — judge clicks a brief, video jumps to the exact quote
- Mitigation for slow YouTube embeds: lazy-load player, show thumbnail placeholder with spinner
- Will wrap in a `'use client'` component since react-player needs browser APIs

### 2.4 FastAPI Deployment → **Skip Render. Run pipeline locally.** ✅ CONFIRMED
- The live demo never hits the backend — everything is pre-cached in Supabase
- We run the pipeline locally during development via `python scripts/run_pipeline.py`
- FastAPI code stays clean and structured (proof of engineering rigor in the repo)
- **Saves ~30-45 min** of deploy config, cold-start debugging, CORS fiddling
- The backend directory and FastAPI routes exist for the README and code review, not for the demo

### 2.5 Spanish-Language Handling → **Extract in Spanish, briefs in Spanish** ✅ CONFIRMED
- Insight extraction preserves the speaker's original phrasing in Spanish
- All briefs generated in Spanish — matches EPIC Lab's ITAM audience
- The forge prompt specifies: "Generate this brief in Spanish for [platform]"
- Preserves voice fidelity end-to-end: source talk → insight → brief all in Spanish
- English briefs can be added as a future roadmap item

### 2.6 Carousel PDF Generation → **Client-side jspdf**
- No server dependency — works on Vercel's edge runtime
- Simple: one slide per page, text + visual suggestion, 1080×1350 aspect ratio
- Library is ~250KB, mature, well-documented
- Alternative (server-side reportlab) is heavier and needs a backend endpoint we're not deploying

### 2.7 LinkedIn Share Button — **Important caveat**
- The spec references `linkedin.com/sharing/share-offsite/?url=...&summary=...`
- **Reality**: LinkedIn deprecated the `summary` parameter. The share-offsite URL only accepts `url`.
- **Workaround**: Auto-copy brief text to clipboard + open `https://www.linkedin.com/sharing/share-offsite/?url={youtube_url}` + toast: "Brief copied! Paste in the LinkedIn composer"
- This is what Buffer, Later, and Hootsuite do. It's honest and functional.
- The X/Twitter intent URL (`twitter.com/intent/tweet?text=...`) works perfectly — 100% real pre-fill.

---

## 3. Architecture Overview

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
│                                                              │
│   Data: reads directly from Supabase via @supabase/supabase-js
└──────────────────────────┬──────────────────────────────────┘
                           │ reads (anon key, RLS off for demo)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│               Supabase (Postgres + pgvector)                 │
│                                                              │
│   talks │ insights │ briefs │ voice_pack                     │
│   trend_matches │ source_posts                               │
│                                                              │
│   pgvector: cosine similarity on insights.embedding          │
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
│   OpenAI API: whisper-1, gpt-4o, gpt-4o-mini,              │
│               text-embedding-3-small                         │
│   All calls: Pydantic + structured outputs (json_schema)     │
└─────────────────────────────────────────────────────────────┘
```

**Key data flow principle**: Frontend → Supabase (direct, read-only). Pipeline → Supabase (write, via service key). Frontend NEVER calls the Python backend.

---

## 4. Directory Structure

```
epic-echo/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI app + routes (exists for code quality, not live demo)
│   │   ├── config.py            # pydantic-settings: env vars
│   │   ├── db.py                # Supabase Python client init
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── schemas.py       # All Pydantic models
│   │   │   └── enums.py         # Platform, JourneyStage, TalkStatus
│   │   ├── pipeline/
│   │   │   ├── __init__.py
│   │   │   ├── ingest.py        # download_audio, transcribe, chunk_transcript
│   │   │   ├── extract.py       # extract_insights, embed_insights
│   │   │   ├── forge.py         # forge_brief, forge_all_briefs
│   │   │   ├── score.py         # score_brief, score_all_briefs
│   │   │   ├── voice.py         # extract_voice_pack (structural + semantic)
│   │   │   └── trends.py        # check_trends, generate_bridge_post
│   │   └── prompts/
│   │       ├── __init__.py
│   │       ├── extraction.py    # Insight extraction system + user prompts
│   │       ├── forge.py         # Brief generation prompts (per platform)
│   │       ├── scoring.py       # 6-axis resonance rubric prompt
│   │       ├── voice_semantic.py # Voice pack semantic extraction prompt
│   │       └── bridge.py        # Trend bridge post prompt
│   ├── seeds/
│   │   ├── trend_headlines.json # 2 hardcoded headlines (you provide)
│   │   ├── source_posts.json    # ~20 EPIC Lab posts (you provide)
│   │   └── time_machine.json    # 1 hardcoded Then & Now entry (you provide)
│   ├── scripts/
│   │   ├── run_pipeline.py      # End-to-end runner: ingest → extract → forge → score
│   │   ├── setup_db.py          # Execute schema.sql against Supabase
│   │   └── seed_data.py         # Load seeds into Supabase
│   ├── requirements.txt
│   └── .env                     # OPENAI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx       # Root layout: fonts, nav, metadata
│   │   │   ├── page.tsx         # Landing page (3 talk cards)
│   │   │   ├── talks/
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx # Editorial Board
│   │   │   ├── voice-pack/
│   │   │   │   └── page.tsx     # Voice Pack showcase
│   │   │   └── about/
│   │   │       └── page.tsx     # Architecture + thesis + roadmap
│   │   ├── components/
│   │   │   ├── ui/              # shadcn/ui primitives (auto-generated)
│   │   │   ├── nav.tsx          # Top navigation bar
│   │   │   ├── landing/
│   │   │   │   ├── talk-card.tsx
│   │   │   │   └── hero.tsx
│   │   │   ├── editorial/
│   │   │   │   ├── resonance-meter.tsx    # Stats bar: briefs, platforms, time saved
│   │   │   │   ├── kanban-board.tsx       # Column layout with grouping toggle
│   │   │   │   ├── kanban-column.tsx      # Single column
│   │   │   │   ├── brief-card.tsx         # Card in kanban (hook, score, badges)
│   │   │   │   ├── group-toggle.tsx       # Platform ↔ Stage toggle
│   │   │   │   └── filter-chips.tsx       # Filter by platform/stage
│   │   │   ├── brief/
│   │   │   │   ├── brief-drawer.tsx       # Sheet (shadcn) — full brief view
│   │   │   │   ├── score-breakdown.tsx    # 6-axis hover tooltip
│   │   │   │   ├── video-player.tsx       # react-player wrapper (client component)
│   │   │   │   ├── publish-bar.tsx        # Row of publish buttons
│   │   │   │   └── carousel-preview.tsx   # Slide-by-slide view for IG carousels
│   │   │   ├── voice-pack/
│   │   │   │   ├── structural-card.tsx    # Numbers + tables
│   │   │   │   └── semantic-card.tsx      # Patterns + phrases
│   │   │   └── shared/
│   │   │       ├── score-badge.tsx        # Color-coded score display
│   │   │       ├── platform-icon.tsx      # Icon per platform
│   │   │       └── loading-skeleton.tsx   # Shimmer loading states
│   │   ├── lib/
│   │   │   ├── supabase.ts      # createClient with env vars (browser client)
│   │   │   ├── supabase-server.ts # Server component client (if needed)
│   │   │   ├── publish.ts       # All publish button logic
│   │   │   ├── types.ts         # TypeScript types mirroring Pydantic models
│   │   │   └── utils.ts         # formatDuration, formatScore, etc.
│   │   └── styles/
│   │       └── globals.css      # Tailwind base + custom CSS vars
│   ├── public/
│   │   └── architecture.png     # Architecture diagram for /about
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── components.json          # shadcn/ui config
│   ├── package.json
│   └── .env.local               # NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
├── supabase/
│   └── schema.sql               # Complete DDL
├── CLAUDE.md                    # Root project instructions for Claude Code
├── backend/CLAUDE.md            # Backend-specific instructions
├── frontend/CLAUDE.md           # Frontend-specific instructions
├── PLAN.md                      # This file (symlink or copy)
├── README.md                    # The real README (written in Block 7)
├── .gitignore
└── LICENSE
```

---

## 5. Data Model (SQL DDL)

This is the complete DDL to run against Supabase. Will be saved to `supabase/schema.sql`.

```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Enums
CREATE TYPE talk_status AS ENUM ('pending', 'transcribing', 'extracting', 'completed', 'failed');
CREATE TYPE platform AS ENUM ('linkedin', 'x', 'instagram_carousel', 'short_form_video');
CREATE TYPE journey_stage AS ENUM ('curious_explorer', 'first_builder', 'growth_navigator', 'ecosystem_leader');

-- ============================================================
-- talks: source content
-- ============================================================
CREATE TABLE talks (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  youtube_url    TEXT NOT NULL UNIQUE,
  title          TEXT NOT NULL,
  speaker_name   TEXT NOT NULL,
  duration_sec   INT,
  language       TEXT DEFAULT 'es',
  raw_transcript JSONB,              -- array of {start, end, text} segments
  status         talk_status DEFAULT 'pending',
  processed_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- insights: atomic units extracted from talks
-- ============================================================
CREATE TABLE insights (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  talk_id          UUID NOT NULL REFERENCES talks(id) ON DELETE CASCADE,
  claim            TEXT NOT NULL,
  evidence         TEXT NOT NULL,
  speaker_quote    TEXT,
  timestamp_start  FLOAT,
  timestamp_end    FLOAT,
  novelty_score    INT CHECK (novelty_score BETWEEN 1 AND 10),
  evidence_density INT CHECK (evidence_density BETWEEN 1 AND 10),
  journey_stages   TEXT[] DEFAULT '{}',
  embedding        VECTOR(1536),
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_insights_talk ON insights(talk_id);
-- ivfflat index for vector search (suitable for <1000 rows)
CREATE INDEX idx_insights_embedding ON insights
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);

-- ============================================================
-- briefs: generated editor-ready briefs
-- ============================================================
CREATE TABLE briefs (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_id             UUID NOT NULL REFERENCES insights(id) ON DELETE CASCADE,
  platform               platform NOT NULL,
  journey_stage          journey_stage NOT NULL,
  hook                   TEXT NOT NULL,
  body                   TEXT NOT NULL,
  structured_payload     JSONB,          -- CarouselPayload or ShortVideoPayload
  suggested_visuals      TEXT,
  cta                    TEXT,
  source_timestamp_start FLOAT,
  source_timestamp_end   FLOAT,
  resonance_score        INT CHECK (resonance_score BETWEEN 0 AND 100),
  score_breakdown        JSONB,          -- ScoreBreakdown model as JSON
  is_time_machine        BOOLEAN DEFAULT false,
  is_trend_match         BOOLEAN DEFAULT false,
  created_at             TIMESTAMPTZ DEFAULT now(),
  updated_at             TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_briefs_insight ON briefs(insight_id);
CREATE INDEX idx_briefs_platform ON briefs(platform);
CREATE INDEX idx_briefs_stage ON briefs(journey_stage);

-- ============================================================
-- voice_pack: extracted EPIC Lab voice profile (single row)
-- ============================================================
CREATE TABLE voice_pack (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  structural_profile JSONB NOT NULL,
  semantic_profile   JSONB NOT NULL,
  sample_count       INT DEFAULT 0,
  source_post_count  INT DEFAULT 0,
  extracted_at       TIMESTAMPTZ DEFAULT now(),
  created_at         TIMESTAMPTZ DEFAULT now(),
  updated_at         TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- trend_matches: Hijacker output
-- ============================================================
CREATE TABLE trend_matches (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  headline           TEXT NOT NULL,
  source_publication TEXT,
  source_url         TEXT,
  matched_insight_id UUID REFERENCES insights(id) ON DELETE SET NULL,
  similarity_score   FLOAT,
  bridge_post_text   TEXT,
  created_at         TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_trends_insight ON trend_matches(matched_insight_id);

-- ============================================================
-- source_posts: scraped EPIC Lab posts for voice extraction
-- ============================================================
CREATE TABLE source_posts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform   TEXT NOT NULL,       -- 'linkedin' or 'instagram' (free text, not the enum)
  raw_text   TEXT NOT NULL,
  scraped_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Auto-update updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_talks_updated BEFORE UPDATE ON talks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_insights_updated BEFORE UPDATE ON insights
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_briefs_updated BEFORE UPDATE ON briefs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_voice_pack_updated BEFORE UPDATE ON voice_pack
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

**Notes on the DDL:**
- `source_posts.platform` is free text (not the enum) because source posts come from LinkedIn/Instagram but are not the 4 output platforms
- `journey_stage` enum values are **placeholders** — will be updated after your input
- ivfflat with `lists = 10` is appropriate for <500 rows; no need for HNSW
- RLS is OFF for the demo (no auth). In production, you'd add policies.

---

## 6. Block-by-Block Implementation

### Block 1 — Repo + Infra (1 hr)

**Goal**: Monorepo scaffolded, Supabase schema live, Vercel deploy verified.

**What I need from you BEFORE starting:**
- [ ] Supabase project created with pgvector enabled → give me: project URL, anon key, service role key
- [ ] OpenAI API key with ~$15 credits
- [ ] Vercel account ready (I'll help connect the GitHub repo)
- [ ] The 3 demo talk YouTube URLs

**Steps:**

| # | Task | Details |
|---|------|---------|
| 1 | Create monorepo structure | All directories from §4, empty `__init__.py` files, config files |
| 2 | Scaffold Next.js frontend | `npx create-next-app@latest` with App Router + TypeScript + Tailwind + src dir |
| 3 | Install frontend deps | `shadcn/ui` init, `@supabase/supabase-js`, `react-player`, `jspdf` |
| 4 | Scaffold Python backend | `requirements.txt`, `app/main.py` with FastAPI health check, `.env` template |
| 5 | Write DDL | Save `supabase/schema.sql` from §5, run against Supabase via `scripts/setup_db.py` |
| 6 | Configure env files | `.env` (backend), `.env.local` (frontend), `.env.example` (committed) |
| 7 | Update .gitignore | Add Node.js, Next.js, .env, Supabase ignores (see §10) |
| 8 | Create CLAUDE.md files | Root + backend + frontend (see §9) |
| 9 | Deploy frontend to Vercel | Empty "EPIC Echo" page with proper metadata |
| 10 | Verify | Vercel loads ✓ · Supabase tables queryable ✓ · Backend starts locally ✓ |

**Your action items during this block:**
- Create the Supabase project at supabase.com and enable the pgvector extension
- Connect the GitHub repo to Vercel (or give me deploy access)

---

### Block 2 — Pipeline Backbone (4 hrs)

**Goal**: Process 1 talk end-to-end, then all 3. Supabase has talks + insights with embeddings.

**What I need from you**: The 3 YouTube URLs (if not provided in Block 1)

**Pipeline flow:**
```
youtube_url
  → yt-dlp downloads audio to tmp/
  → OpenAI whisper-1 transcribes (verbose_json, word timestamps)
  → Save raw_transcript to talks table
  → chunk_transcript(): speaker-turn-based, ~400 token max
  → extract_insights(): gpt-4o structured output per chunk batch
  → embed_insights(): text-embedding-3-small batch call
  → Save insights + embeddings to Supabase
```

**Steps:**

| # | Task | Key Files |
|---|------|-----------|
| 1 | Pydantic models | `backend/app/models/schemas.py` — TranscriptSegment, Chunk, InsightUnit, InsightList |
| 2 | Supabase client | `backend/app/db.py` — init with service role key |
| 3 | Config | `backend/app/config.py` — pydantic-settings BaseSettings |
| 4 | Download audio | `backend/app/pipeline/ingest.py` — yt-dlp async wrapper, output to tmp/ |
| 5 | Transcribe | Same file — OpenAI whisper-1 call, parse verbose_json segments |
| 6 | Chunk | Same file — speaker-turn splitter with 400-token fallback |
| 7 | Extraction prompt | `backend/app/prompts/extraction.py` — system + user template for gpt-4o |
| 8 | Extract insights | `backend/app/pipeline/extract.py` — structured output call, batch chunks by 3 |
| 9 | Embed insights | Same file — text-embedding-3-small batch |
| 10 | Persist | Save talk + insights to Supabase with idempotency (check youtube_url exists) |
| 11 | Runner script | `backend/scripts/run_pipeline.py` — CLI to process 1 or all 3 talks |
| 12 | Run on Talk 1 | Verify data in Supabase, check insight quality, adjust prompts |
| 13 | Run on Talks 2-3 | Process remaining talks, log token usage |

**Extraction prompt design:**
- System: "You extract actionable, evidence-backed insights from founder talks. Each insight must have a concrete claim, supporting evidence, and a direct speaker quote with timestamps."
- User: provides chunk text, speaker name, talk title, language
- Output schema: `InsightList` (list of InsightUnit) via `response_format={"type": "json_schema", ...}`
- Model: **gpt-4o** (needs deep reasoning for novelty scoring and evidence assessment)
- Each InsightUnit includes `journey_stages: list[str]` — the model tags which stages this insight is relevant to

**Cost estimate for Block 2:**
- Whisper: 3 talks × ~45 min × $0.006/min = **~$0.81**
- Extraction (gpt-4o): ~120 chunk-batch calls × ~3K tokens = **~$1.50**
- Embedding: ~45 insights × ~100 tokens = **~$0.01**
- **Total: ~$2.30**

**Checkpoint:**
- [ ] 3 talks in `talks` table with raw_transcript JSONB ✓
- [ ] 30-45 insights in `insights` table with embeddings ✓
- [ ] `SELECT * FROM insights ORDER BY embedding <=> $query LIMIT 5` returns relevant results ✓
- [ ] Each insight has `claim`, `evidence`, `speaker_quote`, valid timestamps ✓

---

### Block 3 — Voice Pack (1 hr)

**Goal**: Extract EPIC Lab's voice profile from ~20 real posts.

**What I need from you BEFORE this block**: JSON file with ~20 scraped EPIC Lab posts in this format:
```json
[
  { "platform": "linkedin", "raw_text": "...", "scraped_at": "2026-04-01T00:00:00Z" },
  { "platform": "instagram", "raw_text": "...", "scraped_at": "2026-04-01T00:00:00Z" }
]
```

**Steps:**

| # | Task | Details |
|---|------|---------|
| 1 | Seed source_posts | Load JSON into source_posts table via `scripts/seed_data.py` |
| 2 | Structural pass (Python, no LLM) | Per-post: sentence length, word count, emoji count, hashtag density, punctuation patterns, opening word. Aggregate: mean/median/stdev. → `StructuralProfile` |
| 3 | Semantic pass (gpt-4o, 1 call) | Input: all 20 posts. Output: `SemanticProfile` — top_5_hook_patterns, banned_phrases, preferred_phrases, tone_descriptors, cta_patterns, formality_level (1-10), spanish_english_mix policy, topic_anchors |
| 4 | Save voice_pack | Single row with both profiles to `voice_pack` table |

**Cost: ~$0.15** (one gpt-4o call with ~4K input tokens)

**Checkpoint:**
- [ ] `voice_pack` table has 1 row ✓
- [ ] Structural profile has sensible numbers (e.g., avg sentence length ~15 words) ✓
- [ ] Semantic profile captures recognizable EPIC Lab patterns ✓

---

### Block 4 — Forge + Resonance (3 hrs)

**Goal**: Generate 50-80 briefs per talk across platforms/stages, score each on 6 axes.

**Steps:**

| # | Task | Details |
|---|------|---------|
| 1 | Journey stage definitions | 4 stages with: audience description, content goal, tone guidance, content examples. Saved in `backend/app/prompts/stages.py` |
| 2 | Platform templates | 4 platform specs with: char limits, structural rules, format constraints. Saved in `backend/app/prompts/platforms.py` |
| 3 | Forge prompt | `backend/app/prompts/forge.py` — Takes (insight, voice_pack, stage, platform) → Brief with structured_payload |
| 4 | Scoring prompt | `backend/app/prompts/scoring.py` — 6-axis rubric with one-sentence justifications per axis |
| 5 | Forge pipeline | `backend/app/pipeline/forge.py` — For each insight: load tagged journey_stages, generate brief for each (stage × platform) combo |
| 6 | Score pipeline | `backend/app/pipeline/score.py` — Score each brief, compute composite (avg × 10 → 0-100) |
| 7 | Run on all 3 talks | Generate + score all briefs, save to Supabase |
| 8 | Quality review | Sample 10 briefs, check: natural language, platform fit, voice match, score justification specificity |

**Platform-specific structured_payload shapes:**

| Platform | structured_payload contents |
|----------|---------------------------|
| LinkedIn | `null` (hook + body + cta is sufficient) |
| X | `null` (hook + body fits in 280 chars) |
| Instagram Carousel | `{ slides: [{ slide_number, headline, body, visual_note }], cover_headline, closing_cta }` |
| Short-Form Video | `{ clip_start, clip_end, caption, hook_overlay, cta_overlay, hashtags: [] }` |

**Resonance Score rubric (6 axes, each 1-10):**

| Axis | What it measures |
|------|------------------|
| Hook Strength | Does the first line stop the scroll? |
| Evidence Density | Is there a specific claim with specific support? |
| Voice Conformance | Does it match the EPIC Lab voice pack? |
| Platform-Format Fit | Does it use the platform's native format correctly? |
| Journey Stage Clarity | Is it obvious who this is for? |
| Novelty | Does it say something the EPIC corpus hasn't said? |

Composite = `round(mean(6 axis scores) × 10)` → 0-100 scale.

**Cost estimate:**
- Forge (gpt-4o-mini): ~240 briefs × ~2K tokens = **~$0.40**
- Scoring (gpt-4o-mini): ~240 briefs × ~1.2K tokens = **~$0.25**
- **Total: ~$0.65**

**Checkpoint:**
- [ ] 50-80 briefs per talk in `briefs` table ✓
- [ ] Each brief has `resonance_score` (0-100) and `score_breakdown` (6 axes with justifications) ✓
- [ ] Instagram carousel briefs have valid `structured_payload` with slides ✓
- [ ] Short-form video briefs have clip timestamps and captions ✓
- [ ] Sample briefs read naturally, match platform format, reflect voice pack ✓

---

### Block 5 — Trend Hijacker (45 min)

**Goal**: 2 trend headlines matched to insights via vector search, with bridge posts.

**What I need from you BEFORE this block**: 2 trend headlines as JSON:
```json
[
  {
    "headline": "...",
    "source_publication": "TechCrunch",
    "source_url": "https://...",
    "publish_date": "2026-04-09"
  }
]
```
Pick headlines that plausibly connect to topics in the 3 demo talks.

**Steps:**

| # | Task | Details |
|---|------|---------|
| 1 | Create seed file | `backend/seeds/trend_headlines.json` |
| 2 | Embed headlines | text-embedding-3-small |
| 3 | Vector search | `SELECT *, 1 - (embedding <=> $1) AS similarity FROM insights ORDER BY embedding <=> $1 LIMIT 3` per headline |
| 4 | Filter by threshold | similarity > 0.70 (adjust if needed) |
| 5 | Generate bridge post | gpt-4o-mini: "Connect this headline to this founder insight in EPIC Lab's voice" |
| 6 | Save trend_matches | Insert rows to Supabase |
| 7 | Mark corresponding brief | Create a brief row with `is_trend_match = true` for each match |

**Bridge prompt design:**
- System: "You write timely content that bridges a trending headline to an existing founder insight. Tone: 'EPIC Lab's speakers saw this coming.'"
- Input: headline, matched_insight (claim + evidence + quote), voice_pack.semantic
- Output: `BridgePost` — hook, body, platform (LinkedIn default)

**Checkpoint:**
- [ ] 1-2 rows in `trend_matches` with bridge posts ✓
- [ ] Bridge posts feel natural, not forced ✓
- [ ] Corresponding brief rows exist with `is_trend_match = true` ✓

---

### Block 5.5 — Time Machine Card (30 min)

**Goal**: One hardcoded "Then & Now" card connecting a talk moment to a real-world outcome.

**What I need from you**: The Time Machine content:
- Which talk and timestamp?
- What did the speaker say?
- What happened since? (e.g., "Plenna raised Series A", "Penta expanded to 3 countries")

**Steps:**
1. Create `backend/seeds/time_machine.json` with the content
2. Insert one row into `briefs` table: `is_time_machine = true`, hand-written body, proper timestamps, platform = linkedin
3. Verify row exists in Supabase

**Checkpoint:**
- [ ] 1 row in `briefs` with `is_time_machine = true` ✓

---

### Block 6 — Frontend (4 hrs)

**Goal**: Polished, 4K-ready dashboard. Every screen demo-worthy.

**Steps:**

| # | Task | Time | Details |
|---|------|------|---------|
| 1 | Supabase client + types | 20 min | `lib/supabase.ts`, `lib/types.ts` mirroring all Pydantic models |
| 2 | Root layout + nav | 20 min | App metadata, Inter/Geist font, dark theme setup, top nav with logo + links |
| 3 | Landing page `/` | 30 min | 3 talk cards with YouTube thumbnails, title, speaker, duration, insight count, brief count. Hero headline: "Dormant wisdom, activated." |
| 4 | Editorial Board `/talks/[id]` | 90 min | **The core screen.** See detailed breakdown below. |
| 5 | Brief Drawer | 45 min | Sheet overlay with full brief, score breakdown on hover, video player, publish buttons |
| 6 | Publish buttons | 30 min | LinkedIn (copy+share), X (tweet intent), IG (copy+PDF), Video (JSON+CapCut+copy), Email, Copy |
| 7 | Voice Pack `/voice-pack` | 20 min | Two cards: structural (tables/numbers) + semantic (patterns/phrases) |
| 8 | About `/about` | 15 min | Architecture diagram (image), thesis, roadmap, honest "what's hardcoded" section |
| 9 | Integration test | 10 min | Click through all routes with real Supabase data |

**Editorial Board breakdown (the hero screen):**

```
┌─────────────────────────────────────────────────────────┐
│  ← Back to Talks    Talk Title — Speaker Name           │
├─────────────────────────────────────────────────────────┤
│  RESONANCE METER                                         │
│  [87 Briefs] [4 Platforms] [4 Stages] [65 hrs saved]    │
├──────────────────┬──────────────────────────────────────┤
│  Group: [Platform ▼ | Stage]   Filter: [All ▼]          │
├──────────────────┴──────────────────────────────────────┤
│  LinkedIn    │  X          │  IG Carousel │  Video       │
│  ┌────────┐  │  ┌────────┐ │  ┌────────┐  │  ┌────────┐ │
│  │ Brief  │  │  │ Brief  │ │  │ Brief  │  │  │ Brief  │ │
│  │ 🔥 82  │  │  │    71  │ │  │    65  │  │  │    78  │ │
│  └────────┘  │  └────────┘ │  └────────┘  │  └────────┘ │
│  ┌────────┐  │  ┌────────┐ │  ┌────────┐  │  ┌────────┐ │
│  │🔮 Then │  │  │ Brief  │ │  │ Brief  │  │  │ Brief  │ │
│  │& Now 90│  │  │    68  │ │  │    73  │  │  │    61  │ │
│  └────────┘  │  └────────┘ │  └────────┘  │  └────────┘ │
│  ...         │  ...        │  ...         │  ...        │
└─────────────────────────────────────────────────────────┘
```

**Brief Drawer layout:**

```
┌──────────────────────────────────┐
│  ✕                               │
│  [LinkedIn] [Curious Explorer]   │  ← platform + stage badges
│                                  │
│  "The hook text goes here..."    │  ← hook (large, bold)
│                                  │
│  Body text of the brief with     │  ← body
│  full content and evidence...    │
│                                  │
│  CTA: Follow EPIC Lab →         │  ← cta
│                                  │
│  ┌──────────────────────────┐   │
│  │  ▶ YouTube Player        │   │  ← react-player seeked to timestamp
│  │    @ 3:42 - 5:18         │   │
│  └──────────────────────────┘   │
│                                  │
│  Resonance: [82/100] ⓘ          │  ← hover ⓘ shows 6-axis breakdown
│                                  │
│  [📋 Copy] [📧 Email] [🔗 Post] │  ← publish buttons
└──────────────────────────────────┘
```

**Publish button implementations:**

| Button | Platform | Implementation |
|--------|----------|---------------|
| Post to LinkedIn | linkedin | Copy brief to clipboard + `window.open('https://www.linkedin.com/sharing/share-offsite/?url={youtube_url}')` + toast "Brief copied! Paste in composer" |
| Post to X | x | `window.open('https://twitter.com/intent/tweet?text={encoded_hook+body+cta}')` — 100% real pre-fill |
| Copy Script | instagram_carousel | `navigator.clipboard.writeText(structured_payload.slides as formatted text)` + toast |
| Download PDF | instagram_carousel | Client-side jspdf: 1080×1350 slides, one per page, text + visual note |
| Download Clip Pack | short_form_video | Download JSON with: youtube_url, start/end timestamps, caption, overlays, hashtags |
| Open in CapCut | short_form_video | `window.open('https://www.capcut.com')` |
| Copy Caption | short_form_video | `navigator.clipboard.writeText(caption)` |
| Email to Team | all | `mailto:?subject={hook}&body={formatted_brief}` |
| Copy | all | `navigator.clipboard.writeText(full_brief)` + toast |

**Optional (20-min budget): Schedule for Later button**
- Opens a Dialog (shadcn) with a fake calendar
- Shows "optimal posting times" from a hardcoded JSON: LinkedIn Tue/Thu 11am, X Mon/Wed 2pm, IG Sat 10am
- Displays a success toast: "Scheduled for Tuesday at 11:00 AM"
- Does NOT actually schedule anything. Pure theater for the demo.

**Checkpoint:**
- [ ] Landing page shows 3 talks with real data ✓
- [ ] Editorial board renders kanban with 50+ cards ✓
- [ ] Platform ↔ Stage toggle works ✓
- [ ] Filter chips filter correctly ✓
- [ ] Trend Match card has orange "🔥 Trending Match" border ✓
- [ ] Time Machine card has purple "🔮 Then & Now" border ✓
- [ ] Brief drawer opens with full content + video player ✓
- [ ] Video player seeks to correct timestamp ✓
- [ ] Score hover shows 6-axis breakdown ✓
- [ ] "Post to X" opens Twitter with pre-filled text ✓
- [ ] "Post to LinkedIn" copies + opens LinkedIn ✓
- [ ] Voice pack page renders both profiles ✓
- [ ] All screens look polished at 4K ✓

---

### Block 7 — Polish + README (1.5 hrs)

**Steps:**

| # | Task | Time | Details |
|---|------|------|---------|
| 1 | Loading states | 15 min | Skeleton shimmers for all async data (brief cards, drawer, voice pack) |
| 2 | Empty states | 10 min | Helpful messages if no data (shouldn't happen in demo, but good practice) |
| 3 | Tooltips | 15 min | On score badges, publish buttons, Resonance Meter metrics |
| 4 | Transitions | 10 min | Smooth drawer open/close, card hover effects, filter animations |
| 5 | Desktop-only banner | 5 min | Small banner on mobile viewports: "EPIC Echo is optimized for desktop" |
| 6 | README.md | 30 min | The why thesis, architecture diagram, tech stack, what's real vs hardcoded, setup instructions, roadmap |
| 7 | Final walkthrough | 15 min | Fresh browser, all routes, all interactions, screenshot at 4K |

**README structure:**
1. EPIC Echo — headline + one-sentence pitch
2. The Why — 3 paragraphs: the problem, the thesis, the approach
3. Architecture — diagram + tech stack table
4. What's Real vs. What's Hardcoded — honest table (real: pipeline, scoring, vector search, share intents. hardcoded: trend headlines, time machine, scheduling UI)
5. Setup Instructions — for anyone who wants to run it
6. Roadmap — real API integrations (Meta Graph, LinkedIn, X), RSS trend scraper, multi-institution, analytics
7. Built for MAD Fellowship 2026

---

## 7. Risks & Mitigations

### Risk 1: OpenAI API Cost Overrun
**Impact**: Pipeline runs get expensive if prompts are inefficient or we re-run unnecessarily.
**Mitigation**:
- gpt-4o-mini for ALL high-volume calls (forge, scoring, bridge). gpt-4o ONLY for extraction (quality-critical) and voice semantic (1 call).
- Aggressive idempotency: check Supabase before every API call. Never re-process existing data.
- Estimated total cost: **~$3-5** for the complete pipeline across 3 talks.
- Log token usage per call to catch inefficiencies early.

### Risk 2: Brief Quality Degrades to "AI Slop"
**Impact**: 200+ briefs generated by gpt-4o-mini risk being repetitive, generic, and soulless. This is the exact thing the spec says we're NOT building.
**Mitigation**:
- **Voice pack in every forge prompt** — anchors style to EPIC Lab's actual patterns
- **Specific insight + direct quote in every prompt** — anchors content to real moments
- **Platform-specific structural constraints** — forces format discipline
- **Manual sample review after Talk 1** — adjust prompts before processing Talks 2-3
- **Resonance scoring catches the worst offenders** — low voice_conformance = flag for review

### Risk 3: YouTube Embed Flakiness During Demo Recording
**Impact**: react-player fails to load, autoplay blocked, or CORS error during the critical drawer moment.
**Mitigation**:
- Pre-test all 3 demo videos in the deployed Vercel environment before recording
- Fallback: if embed fails, render a high-quality thumbnail + "▶ Play from 3:42" link that opens `youtube.com/watch?v={id}&t={seconds}` in new tab
- Demo is pre-recorded — we can retry. Don't over-engineer for first-run reliability.

### Risk 4 (Minor): Supabase Free Tier Limits
**Impact**: 500MB database, 1GB storage, 50K monthly active users.
**Mitigation**: We'll use ~5MB of data total. Not a concern. But: ensure we're not accidentally storing audio files in Supabase Storage — delete tmp/ audio after transcription.

---

## 8. Prerequisites Checklist

**Before Block 1 starts, I need these from you:**

| # | Item | Format | Block |
|---|------|--------|-------|
| 1 | **3 demo talk YouTube URLs** | 3 URLs | Block 1 |
| 2 | **Supabase project credentials** | Project URL + anon key + service role key | Block 1 |
| 3 | **OpenAI API key** | API key string (with ~$15 credits) | Block 2 |
| 4 | **Vercel account** | Connected to GitHub repo, or Vercel CLI token | Block 1 |
| 5 | **~20 scraped EPIC Lab posts** | JSON array: `[{platform, raw_text, scraped_at}]` | Block 3 |
| 6 | **2 trend headlines** | JSON: `[{headline, source_publication, source_url, publish_date}]` | Block 5 |
| 7 | **Time Machine content** | Talk reference + timestamp + present-day outcome | Block 5.5 |
| 8 | ~~Journey stage definitions~~ | ✅ Confirmed: Curious Explorer, First Builder, Growth Navigator, Ecosystem Leader | Block 4 |
| 9 | ~~Brief language preference~~ | ✅ Confirmed: Spanish | Block 4 |

**What I can start WITHOUT your input:** Blocks 1-2 (repo structure, DDL, pipeline backbone) only need items 1-4. Blocks 3+ need the remaining items.

**Your action items (things only you can do):**
- Create Supabase project at supabase.com, enable pgvector extension
- Create Vercel project or connect GitHub repo
- Scrape ~20 EPIC Lab LinkedIn/Instagram posts into the JSON format
- Write 2 trend headlines that connect to the demo talks
- Write the Time Machine card content (1 paragraph)
- Confirm journey stage definitions
- Confirm brief language

---

## 9. CLAUDE.md Specifications

These files will be created in Block 1 to make every future Claude Code session productive.

### Root CLAUDE.md
```
# EPIC Echo

Content intelligence layer that transforms dormant EPIC Lab talks into editor-ready briefs.
Built for MAD Fellowship 2026.

## Architecture
- Frontend: Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui → Vercel
- Backend: Python 3.11 + FastAPI (local pipeline runner, NOT deployed)
- Database: Supabase Postgres + pgvector
- LLM: OpenAI only (gpt-4o, gpt-4o-mini, whisper-1, text-embedding-3-small)

## Key Constraints
- NO auth, NO Docker, NO LangChain/LlamaIndex, NO Anthropic API in prod
- ALL LLM calls use Pydantic + structured outputs (response_format json_schema)
- ALL prompts live in backend/app/prompts/ as .py files with builder functions
- Frontend reads from Supabase DIRECTLY. Never calls the Python backend.
- The demo is pre-recorded. All data is pre-cached. Optimize for visual polish.

## Running
- Backend: `cd backend && python scripts/run_pipeline.py`
- Frontend: `cd frontend && npm run dev`

## Code Style
- Python: type hints everywhere, async where possible, Pydantic for all data shapes
- TypeScript: strict mode, prefer server components, client components only when needed
- Use shadcn/ui components. Do not install other UI libraries.
- Do not add features not in the spec. Do not skip features in the spec.
```

### backend/CLAUDE.md
```
# EPIC Echo Backend

Python 3.11+ FastAPI pipeline for processing EPIC Lab talks.

## Structure
- app/models/ — Pydantic schemas (source of truth for all data shapes)
- app/pipeline/ — Processing functions (ingest, extract, forge, score, voice, trends)
- app/prompts/ — LLM prompt builder functions (NEVER inline prompts in pipeline code)
- app/db.py — Supabase client
- scripts/ — CLI runners (run_pipeline.py, setup_db.py, seed_data.py)
- seeds/ — JSON seed data (trend headlines, source posts, time machine)

## Rules
- Every LLM call MUST use Pydantic model + response_format json_schema. No string parsing.
- gpt-4o for extraction only. gpt-4o-mini for everything else.
- Check Supabase before calling OpenAI. Never re-process existing data.
- All pipeline functions are async. Use asyncio.gather for parallel calls.
- Delete audio files from tmp/ after transcription.
```

### frontend/CLAUDE.md
```
# EPIC Echo Frontend

Next.js 15 App Router + TypeScript + Tailwind + shadcn/ui.

## Structure
- src/app/ — Routes (landing, talks/[id], voice-pack, about)
- src/components/ — Component tree (landing/, editorial/, brief/, voice-pack/, shared/, ui/)
- src/lib/ — Supabase client, publish logic, types, utils

## Rules
- Read from Supabase directly via @supabase/supabase-js. NEVER call the Python backend.
- Use shadcn/ui components for all UI. Do not install other UI libraries.
- Server components by default. Use 'use client' only for: react-player, interactive state, clipboard API.
- All data types in lib/types.ts mirror the Pydantic models exactly.
- Desktop-only design. No mobile responsive work.
- Every screen must look polished at 4K resolution.
```

---

## 10. .gitignore Updates

Current .gitignore is Python-only. Will add these sections:

```gitignore
# === Node.js / Next.js ===
node_modules/
.next/
out/
frontend/.next/
frontend/node_modules/

# === Environment ===
.env
.env.local
.env.*.local
backend/.env
frontend/.env.local

# === IDE ===
.vscode/
.idea/
*.swp
*.swo

# === OS ===
.DS_Store
Thumbs.db

# === Temp / Audio ===
tmp/
*.mp3
*.m4a
*.wav
*.ogg

# === Supabase ===
supabase/.temp/

# === Build artifacts ===
*.pyc
__pycache__/
dist/
build/
*.egg-info/
```

---

## Cost Summary

| Component | Model | Estimated Cost |
|-----------|-------|---------------|
| Transcription (3 talks) | whisper-1 | $0.81 |
| Insight extraction | gpt-4o | $1.50 |
| Embeddings | text-embedding-3-small | $0.01 |
| Voice pack semantic | gpt-4o | $0.15 |
| Brief generation (~240) | gpt-4o-mini | $0.40 |
| Brief scoring (~240) | gpt-4o-mini | $0.25 |
| Trend bridge posts (2) | gpt-4o-mini | $0.01 |
| **Total** | | **~$3.13** |

Buffer for prompt iteration and re-runs: **~$10 total**.
