# EPIC Echo Backend

Python 3.11+ FastAPI pipeline for processing EPIC Lab talks.

## Structure
- app/models/ — Pydantic schemas (source of truth for all data shapes)
- app/pipeline/ — Processing functions (ingest, extract, forge, score, voice, trends)
- app/prompts/ — LLM prompt builder functions (NEVER inline prompts in pipeline code)
- app/db.py — Supabase client (uses service role key)
- scripts/ — CLI runners (run_pipeline.py, setup_db.py, seed_data.py)
- seeds/ — JSON seed data (trend headlines, source posts, time machine)

## Rules
- Every LLM call MUST use Pydantic model + response_format json_schema. No string parsing.
- Azure OpenAI client: use `AsyncAzureOpenAI` from `openai` package.
- Deployments: gpt4o_deployment for extraction (quality-critical). gpt4o_mini_deployment for forge/score/bridge.
- Check Supabase before calling OpenAI. Never re-process existing data (idempotency).
- All pipeline functions are async. Use asyncio.gather for parallel calls.
- Delete audio files from tmp/ after transcription.

## LLM Configuration (Azure OpenAI)
- Endpoint: loaded from backend/.env (AZURE_OPENAI_ENDPOINT)
- API Version: 2024-12-01-preview
- Deployment names: loaded from .env (GPT4O_DEPLOYMENT, WHISPER_DEPLOYMENT, EMBEDDING_DEPLOYMENT)
- Client: `AsyncAzureOpenAI` for async functions, `AzureOpenAI` for sync
- ALWAYS pass deployment names via `settings.*_deployment` — never hardcode model strings

## Python Virtual Environment (REQUIRED)
- Location: `backend/.venv/`
- ALWAYS activate before running any Python:
  ```bash
  cd backend
  source .venv/Scripts/activate    # Windows bash
  # source .venv/bin/activate      # Mac/Linux
  ```
- First-time setup:
  ```bash
  cd backend && python -m venv .venv
  source .venv/Scripts/activate
  pip install -r requirements.txt
  ```

## Running Locally
```bash
cd backend
source .venv/Scripts/activate
python scripts/test_connection.py  # Verify Azure + Supabase before running pipeline
python scripts/run_pipeline.py --talk 1    # Process Talk 1
python scripts/run_pipeline.py --all       # Process all 3 talks
uvicorn app.main:app --reload              # FastAPI health check (optional)
```
