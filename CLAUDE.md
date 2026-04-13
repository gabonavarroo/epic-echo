# EPIC Echo

Content intelligence layer that transforms dormant EPIC Lab talks into editor-ready briefs.
Built for MAD Fellowship 2026.

## Architecture
- Frontend: Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui → Vercel
- Backend: Python 3.11 + FastAPI (local pipeline runner, NOT deployed)
- Database: Supabase Postgres + pgvector
- LLM: Azure OpenAI (gpt-4o, gpt-4o-mini, whisper, text-embedding-3-small via https://gpt-4o-epic.openai.azure.com/)

## Key Constraints
- NO auth, NO Docker, NO LangChain/LlamaIndex
- ALL LLM calls use Pydantic + structured outputs (response_format json_schema)
- ALL prompts live in backend/app/prompts/ as .py files with builder functions
- Frontend reads from Supabase DIRECTLY. Never calls the Python backend.
- The demo is pre-recorded. All data is pre-cached. Optimize for visual polish.

## Running
- Backend (use the venv — ALWAYS activate before running Python):
  ```bash
  cd backend
  source .venv/Scripts/activate   # Windows bash
  # source .venv/bin/activate     # Mac/Linux

  python scripts/run_pipeline.py --talk 1      # Block 2: ingest talk
  python scripts/run_pipeline.py --voice        # Block 3: voice pack
  python scripts/run_pipeline.py --forge        # Block 4: forge + score all briefs
  python scripts/run_pipeline.py --forge --talk 2  # Block 4: forge one talk
  python scripts/run_pipeline.py --trends       # Block 5: trend hijacker
  python scripts/run_pipeline.py --time-machine # Block 5.5: time machine card
  ```
- Frontend: `cd frontend && npm run dev`

## Azure OpenAI Rate Limit Notes (IMPORTANT)
- Single gpt-4o deployment used for ALL models (gpt4o + gpt4o_mini share capacity)
- Forge/score pipeline uses Semaphore(2) + 0.6s pacing to avoid 429s
- If you get a 429 RateLimitError, wait 60s and retry — the per-minute window resets
- Do NOT run --forge and --trends simultaneously

## Python Virtual Environment
- Location: `backend/.venv/`
- ALWAYS activate the venv before running any Python command in backend/
- First-time setup: `cd backend && python -m venv .venv && source .venv/Scripts/activate && pip install -r requirements.txt`

## Code Style
- Python: type hints everywhere, async where possible, Pydantic for all data shapes
- TypeScript: strict mode, prefer server components, client components only when needed
- Use shadcn/ui components. Do not install other UI libraries.
- Do not add features not in the spec. Do not skip features in the spec.

## Session Handoff
- See PROGRESS.md for current build status
- See ARCHITECTURE.md for system design decisions
- Plan is at .claude/plans/tender-doodling-sparkle.md
