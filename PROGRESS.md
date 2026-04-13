# EPIC Echo — Build Progress

## Block 7 Checklist (Completed: 2026-04-12)

- [x] `src/app/globals.css` — `.skeleton` utility class added (shimmer keyframe → usable on any placeholder block)
- [x] `src/app/loading.tsx` — Landing page skeleton: hero rings + 3 TalkCard shimmer placeholders
- [x] `src/app/talks/[id]/loading.tsx` — Editorial Board skeleton: Resonance Meter bar + 4 Kanban column placeholders
- [x] `src/app/voice-pack/loading.tsx` — Voice Pack skeleton: header + 2 card shimmer placeholders
- [x] `src/app/layout.tsx` — Mobile banner added (`lg:hidden`): amber strip with warning icon, non-intrusive
- [x] `src/components/editorial/resonance-meter.tsx` — Converted to `'use client'`; shadcn Tooltips on all StatItem metrics, trending/time-machine badges, and ScoreBar
- [x] `README.md` (root) — Full professional README: pitch, thesis, ASCII architecture diagram, setup instructions, pipeline stages, What's Real vs. Hardcoded table, AI usage breakdown, MAD Fellowship note

---

## Block 6 Checklist (Completed: 2026-04-12)

- [x] `globals.css` — echo-ring, slide-in-left, float, text-shimmer, card-appear keyframes added
- [x] `src/components/nav.tsx` — sticky blur nav, active link highlighting, echo pulse logo dot
- [x] `src/components/landing/hero.tsx` — sonar echo rings, gradient "reborn." headline, stats pills, staggered fade-in-up
- [x] `src/components/landing/talk-card.tsx` — YouTube thumbnail, title/speaker, insight+brief stat pills, platform dots, Manage Briefs CTA
- [x] `src/app/page.tsx` — server component, fetches talks + per-talk insight/brief counts, ISR revalidate=60
- [x] `src/app/layout.tsx` — Nav injected into root layout
- [x] Echo animation redesigned: echo-ring-burst (fires once) + echo-ring-ambient (infinite loop); 9 rings in 2 heartbeat clusters + 7 static track rings
- [x] `src/components/shared/score-badge.tsx` — Color-coded score chip (emerald/yellow/orange)
- [x] `src/components/shared/platform-icon.tsx` — PlatformBadge + PlatformDot per platform
- [x] `src/components/editorial/resonance-meter.tsx` — Stats bar (briefs, platforms, stages, time saved, avg score, dist bar, special badges)
- [x] `src/components/editorial/brief-card.tsx` — Hook, score, platform/stage badge, timestamp, trend/time-machine indicators
- [x] `src/components/editorial/kanban-column.tsx` — Sticky header, card list, column avg score
- [x] `src/components/editorial/kanban-board.tsx` — Client component; group-by toggle (platform/stage), filter chips, sort: specials first then score desc
- [x] `src/app/talks/[id]/page.tsx` — Server page; fetches talk + insights + briefs; passes to KanbanBoard
- [x] `src/components/brief/video-player.tsx` — react-player (dynamic, ssr:false), auto-seeks to source_timestamp_start on ready
- [x] `src/components/brief/score-breakdown.tsx` — 6-axis progress bars, staggered cascade animation on mount
- [x] `src/components/brief/carousel-preview.tsx` — horizontal scrollable mini-cards (cover + slides + CTA)
- [x] `src/components/brief/publish-bar.tsx` — platform-specific actions + Copy/Email universal; emerald toast
- [x] `src/components/brief/brief-drawer.tsx` — Sheet (580px), sticky header, scrollable body, sticky publish bar
- [x] Echo rings restored to original design: 8 rings (220→990px), scale(0.4)→scale(2.8), white/gray rgba(255,255,255,0.14), 0.7s stagger
- [x] `src/app/voice-pack/page.tsx` — Structural card (metrics table, opening/punctuation patterns) + Semantic card (formality meter, tone, hook patterns, preferred/banned phrases, CTA patterns, topic anchors)
- [x] `src/app/about/page.tsx` — Thesis, ASCII architecture diagram, tech stack grid, pipeline stages, hardcoded items, EchoStudio roadmap
- [x] `src/components/voice-pack/structural-card.tsx` — Stat rows, tag chips, core metrics + patterns
- [x] `src/components/voice-pack/semantic-card.tsx` — Formality meter, phrase chips (preferred/banned/tone/cta), hook pattern list

---

## Block Status

| Block | Name | Status | Notes |
|-------|------|--------|-------|
| 1 | Repo + Infra | ✅ Complete | Monorepo scaffolded, schema live, env configured |
| 2 | Pipeline Backbone | ✅ Complete | 3 talks processed, 92 insights + embeddings in Supabase |
| 3 | Voice Pack | ✅ Complete | 63 posts seeded, voice_pack row saved — ID: 0b2b694d |
| 4 | Forge + Resonance | ✅ Complete | 748 regular briefs — avg 79.0/100, min 58, max 92 |
| 5 | Trend Hijacker | ✅ Complete | 2 matches (sim=0.571, 0.562), 2 bridge briefs scored |
| 5.5 | Time Machine | ✅ Complete | 1 brief (Clip unicornio) — score 90 — ID: 99a427c1 |
| 6 | Frontend | ✅ Complete | All routes live: Landing, Editorial Board, Brief Drawer, Voice Pack, About |
| 7 | Polish + README | ✅ Complete | Skeletons, mobile banner, tooltips, README |

---

## Block 5.5 Checklist (Completed: 2026-04-12)

- [x] `seeds/time_machine.json` — Clip unicornio case (Adolfo Babatz talk, ~16m mark)
- [x] `run_pipeline.py --time-machine` flag added
- [x] Brief row inserted: `is_time_machine=True`, platform=linkedin, resonance_score=90
- [x] Matched to insight: "El sistema financiero mexicano presenta un atraso significativo..."
- [x] Brief hook: "Hace unos años, Adolfo Babatz dijo que el sistema de pagos en México era un desierto..."
- [x] ID: 99a427c1-146e-4d48-bdfb-ddeedbf26269

---

## Block 5 Checklist (Completed: 2026-04-12)

- [x] `seeds/trend_headlines.json` — 2 headlines (Forbes/Expansión)
- [x] `run_pipeline.py --trends` flag added
- [x] `app/pipeline/trends.py` — embed_headline, find_matching_insight, generate_bridge_post
- [x] `app/prompts/bridge.py` — BRIDGE_SCHEMA (strict), build_bridge_messages
- [x] Headline 1: "La IA reemplaza puestos en marketing..." → sim=0.571 → bridge post saved + scored
- [x] Headline 2: "Burnout y salud mental de CEOs..." → sim=0.562 → bridge post saved + scored
- [x] 2 rows in `trend_matches` table with bridge_post_text
- [x] 2 brief rows with `is_trend_match=True` (platform=linkedin, both scored)
- [x] Similarity threshold lowered to 0.50 (founder talks ≠ news vocabulary; 0.70 was too strict)

---

## Block 4 Checklist (Completed: 2026-04-12)

- [x] `app/prompts/stages.py` — 4 Journey Stage definitions (audience, goal, tone, CTA style)
- [x] `app/prompts/platforms.py` — 4 platform specs + strict JSON schemas (BRIEF_SCHEMA_SIMPLE/CAROUSEL/VIDEO)
- [x] `app/prompts/forge.py` — imports from stages/platforms, richer 7-rule system prompt
- [x] `app/prompts/scoring.py` — SCORE_SCHEMA strict=True, removed min/max (Azure strict mode incompatible)
- [x] `app/pipeline/forge.py` — Semaphore(2), 0.6s pacing, max_retries=6, platform-specific schemas
- [x] `app/pipeline/score.py` — Semaphore(3), 0.3s pacing, max_retries=6, axis clamping
- [x] `scripts/run_pipeline.py` — --forge, --score, --trends, --time-machine flags
- [x] Talk 1 briefs: 256 (32 insights × ~2 stages × 4 platforms) — avg score 78.8/100
- [x] Talk 2 briefs: 284 (33 insights × ~2.1 stages × 4 platforms)
- [x] Talk 3 briefs: 208 (27 insights × ~1.9 stages × 4 platforms)
- [x] All briefs have resonance_score (0-100) and score_breakdown (6 axes + justifications)
- [x] Instagram carousel briefs have structured_payload with slides array
- [x] Short-form video briefs have clip timestamps, caption, overlays, hashtags

---

## Block 3 Checklist (Completed: 2026-04-12)

- [x] `seeds/source_posts.json` — 63 real EPIC Lab posts (LinkedIn + Instagram)
- [x] `scripts/seed_data.py` — UTF-8 fix; seeds source_posts with `--posts` flag
- [x] `scripts/run_pipeline.py` — `--voice` flag added; orchestrates full voice pipeline
- [x] `app/pipeline/voice.py` — Structural pass (pure Python) + Semantic pass (gpt-4o)
- [x] `app/prompts/voice_semantic.py` — Prompt + VOICE_SCHEMA for structured output
- [x] `app/models/schemas.py` — StructuralProfile + SemanticProfile Pydantic schemas
- [x] Structural results: avg 169.6 words/post, 3.67 emojis/post, 2.11 hashtags/post
- [x] Semantic results: formality 6/10, tone = inspirador/directo/educativo/profesional
- [x] voice_pack row in Supabase — ID: 0b2b694d-2e51-420d-b9ec-59801fa3e3fb

---

## Block 2 Checklist (Completed: 2026-04-12)

- [x] `app/config.py` — absolute env_file path, gpt4o_mini defaults to same deployment
- [x] `app/pipeline/ingest.py` — Azure Whisper, no FFmpeg required, low-bitrate webm format, ffmpeg fallback if >24 MB
- [x] `app/pipeline/extract.py` — AsyncAzureOpenAI, Semaphore(4) concurrency, json_schema structured output
- [x] `scripts/run_pipeline.py` — 3 demo URLs hardcoded, UTF-8 stdout fix, 50-row batch inserts
- [x] `scripts/test_connection.py` — UTF-8 stdout fix, [OK]/[FAIL] markers
- [x] `requirements.txt` — yt-dlp upgraded to >=2026.3.17
- [x] Talk 1 processed: "Del sueño a la dirección (CEO)" — 455 segments → 32 insights — ID: b2c6aed7
- [x] Talk 2 processed: "Adolfo Babatz, CLIP" — 1556 segments → 33 insights — ID: 80fa8d4b
- [x] Talk 3 processed: "Cómo piensa un CMO" — 1701 segments → 27 insights — ID: fbb053a8
- [x] 92 total insights with 1536-dim embeddings in Supabase `insights` table

---

## Block 1 Checklist (Completed: 2026-04-11)

- [x] `.gitignore` updated (env files, node_modules, Supabase temp, audio)
- [x] Monorepo structure created (`backend/`, `frontend/`, `supabase/`)
- [x] CLAUDE.md files created (root, backend, frontend)
- [x] Backend Python scaffold complete
- [x] `requirements.txt` written
- [x] `supabase/schema.sql` written (DDL with pgvector, enums, tables, triggers, match_insights RPC)
- [x] Next.js 15 frontend scaffolded (App Router, TypeScript, Tailwind, shadcn/ui)
- [x] Frontend deps installed: @supabase/supabase-js, react-player, jspdf
- [x] shadcn/ui init complete (button, sheet, badge, card, separator, tooltip, dialog)
- [x] Frontend `src/lib/` files: supabase.ts, types.ts, utils.ts, publish.ts
- [x] `backend/.env` configured (Azure OpenAI placeholder + Supabase keys)
- [x] `frontend/.env.local` configured (Supabase anon key)

---

## Pending User Actions Before Block 2

### 1. Apply Supabase Schema (REQUIRED)
Go to: [Supabase Dashboard](https://supabase.com/dashboard/project/pnjhwnylacsgfjtyzuxy) → SQL Editor → New Query → paste contents of `supabase/schema.sql` → Run

### 2. Add Azure OpenAI Key
Edit `backend/.env` and replace `your-azure-openai-api-key-here` with your actual key.

---

## Architecture Decisions Log

| Decision | Choice | Reason |
|----------|--------|--------|
| LLM provider | Azure OpenAI (not standard OpenAI) | User has Azure credits |
| FastAPI | Local only, not deployed | Demo is pre-cached; saves 30-45min deploy config |
| Chunking | Speaker-turn + 400-token fallback | Preserves context + timestamps |
| Brief language | Spanish | EPIC Lab's ITAM audience |
| Video player | react-player | Native YouTube embed + `seekTo()` |
| PDF generation | jspdf (client-side) | No server needed for Vercel |
| LinkedIn share | Copy + open share URL | LinkedIn deprecated `summary` param |
| Vector search | ivfflat (lists=10) | Appropriate for <500 rows |
| Trend similarity threshold | 0.50 (not 0.70) | Founder talks use different vocabulary than news; 0.70 yielded 0 matches |
| Azure strict JSON schema | No min/max on integers | Azure strict mode doesn't support numeric constraints; Pydantic validates |
| Forge/score concurrency | Semaphore(2) + 0.6s pacing | Single gpt-4o deployment shared between all models; 429 at higher concurrency |
