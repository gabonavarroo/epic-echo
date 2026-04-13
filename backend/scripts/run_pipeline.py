"""
EPIC Echo end-to-end pipeline runner.

Usage:
  cd backend
  source .venv/Scripts/activate   # Windows bash

  # Block 2 — Ingest + extract insights
  python scripts/run_pipeline.py --talk 1          # Process Talk 1 only
  python scripts/run_pipeline.py --talk 2
  python scripts/run_pipeline.py --talk 3
  python scripts/run_pipeline.py --all             # Process all 3 talks
  python scripts/run_pipeline.py --url "https://youtube.com/..."

  # Block 3 — Voice Pack
  python scripts/run_pipeline.py --voice           # Extract voice pack from source_posts

  # Block 4 — Forge + Score (generates briefs for all completed talks)
  python scripts/run_pipeline.py --forge           # Generate + score ALL briefs
  python scripts/run_pipeline.py --forge --talk 1  # Forge only Talk 1's briefs
  python scripts/run_pipeline.py --score           # Re-score existing unscored briefs

The 3 demo talk URLs are hardcoded in DEMO_TALKS below.
"""
from __future__ import annotations
import asyncio
import argparse
import io
import sys
import time
from datetime import datetime
from pathlib import Path

# Force UTF-8 output on Windows to avoid UnicodeEncodeError with box-drawing chars
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

# Add backend/ to path so we can import app.*
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.config import settings
from app.db import get_supabase
from app.pipeline.ingest import download_audio, transcribe, chunk_transcript
from app.pipeline.extract import extract_insights, embed_insights
from app.pipeline.voice import extract_voice_pack

# ── Demo talk URLs ─────────────────────────────────────────────────────────
DEMO_TALKS = [
    "https://www.youtube.com/watch?v=OgePyNAZDIs",
    "https://www.youtube.com/watch?v=1Pky04lprTY",
    "https://www.youtube.com/watch?v=BHM8IQa13bw",   # t=9s stripped — yt-dlp downloads full video
]


# ── Helpers ────────────────────────────────────────────────────────────────

def _log(msg: str) -> None:
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"[{ts}] {msg}")


def _hr(title: str = "") -> None:
    if title:
        print(f"\n{'─' * 20} {title} {'─' * 20}")
    else:
        print("─" * 60)


# ── Block 2: Ingest pipeline ───────────────────────────────────────────────

async def ingest_talk(youtube_url: str) -> str | None:
    """
    Full ingest pipeline for one talk:
      download → transcribe → chunk → extract insights → embed → save to Supabase

    Returns the talk_id if successful, None if skipped (already completed).
    """
    supabase = get_supabase()

    # ── Idempotency check ──────────────────────────────────────────────────
    import re
    clean_url_for_lookup = re.sub(r"[&?]t=\d+s?", "", youtube_url).rstrip("?&")

    existing = (
        supabase.table("talks")
        .select("id, status, title")
        .eq("youtube_url", clean_url_for_lookup)
        .execute()
    )

    if existing.data and existing.data[0]["status"] == "completed":
        _log(f"SKIP — already completed: {existing.data[0]['title']}")
        return existing.data[0]["id"]

    talk_id: str | None = existing.data[0]["id"] if existing.data else None

    # ── Step 1: Download audio ─────────────────────────────────────────────
    _log("Step 1/5: Downloading audio...")
    t0 = time.time()
    audio_path, video_info = await download_audio(youtube_url)
    _log(f"Done in {time.time() - t0:.1f}s — {video_info.title}")

    # ── Upsert talk row (status = transcribing) ────────────────────────────
    talk_data = {
        "youtube_url": clean_url_for_lookup,
        "title": video_info.title,
        "speaker_name": video_info.speaker_name,
        "duration_sec": video_info.duration_sec,
        "language": "es",
        "status": "transcribing",
    }

    if talk_id:
        supabase.table("talks").update(talk_data).eq("id", talk_id).execute()
    else:
        result = supabase.table("talks").insert(talk_data).execute()
        talk_id = result.data[0]["id"]

    _log(f"Talk ID: {talk_id}")

    # ── Step 2: Transcribe ─────────────────────────────────────────────────
    _log("Step 2/5: Transcribing with Azure Whisper...")
    t0 = time.time()
    segments = await transcribe(audio_path)
    _log(f"Done in {time.time() - t0:.1f}s — {len(segments)} segments")

    supabase.table("talks").update({
        "raw_transcript": [s.model_dump() for s in segments],
        "status": "extracting",
    }).eq("id", talk_id).execute()

    # ── Step 3: Chunk ──────────────────────────────────────────────────────
    _log("Step 3/5: Chunking transcript...")
    chunks = chunk_transcript(segments)
    _log(f"{len(chunks)} chunks (≤400 tokens each)")

    # ── Step 4: Extract insights ───────────────────────────────────────────
    _log("Step 4/5: Extracting insights with gpt-4o...")
    t0 = time.time()
    insights = await extract_insights(
        chunks=chunks,
        speaker_name=video_info.speaker_name,
        talk_title=video_info.title,
    )
    _log(f"Done in {time.time() - t0:.1f}s — {len(insights)} insights")

    if not insights:
        _log("WARNING: No insights extracted. Check extraction prompt and talk content.")
        supabase.table("talks").update({"status": "failed"}).eq("id", talk_id).execute()
        return None

    # ── Step 5: Embed + save ───────────────────────────────────────────────
    _log("Step 5/5: Embedding insights...")
    t0 = time.time()
    embeddings = await embed_insights(insights)
    _log(f"Done in {time.time() - t0:.1f}s")

    existing_insights = (
        supabase.table("insights").select("id").eq("talk_id", talk_id).execute()
    )
    if existing_insights.data:
        _log(f"Deleting {len(existing_insights.data)} existing insights (re-processing)...")
        supabase.table("insights").delete().eq("talk_id", talk_id).execute()

    _log(f"Saving {len(insights)} insights to Supabase...")
    insight_rows = []
    for insight, embedding in zip(insights, embeddings):
        insight_rows.append({
            "talk_id": talk_id,
            "claim": insight.claim,
            "evidence": insight.evidence,
            "speaker_quote": insight.speaker_quote,
            "timestamp_start": insight.timestamp_start,
            "timestamp_end": insight.timestamp_end,
            "novelty_score": insight.novelty_score,
            "evidence_density": insight.evidence_density,
            "journey_stages": insight.journey_stages,
            "embedding": embedding,
        })

    BATCH = 50
    for i in range(0, len(insight_rows), BATCH):
        supabase.table("insights").insert(insight_rows[i:i + BATCH]).execute()

    supabase.table("talks").update({
        "status": "completed",
        "processed_at": datetime.utcnow().isoformat(),
    }).eq("id", talk_id).execute()

    _log(f"✓ Talk complete — {len(insights)} insights in Supabase")
    return talk_id


async def process_by_index(talk_index: int) -> None:
    """Process a demo talk by its 1-based index (1, 2, or 3)."""
    if talk_index < 1 or talk_index > len(DEMO_TALKS):
        _log(f"ERROR: Invalid talk index {talk_index}. Must be 1-{len(DEMO_TALKS)}.")
        return

    url = DEMO_TALKS[talk_index - 1]
    _hr(f"Talk {talk_index}")
    _log(f"URL: {url}")

    t_total = time.time()
    talk_id = await ingest_talk(url)
    elapsed = time.time() - t_total

    if talk_id:
        _hr()
        _log(f"Talk {talk_index} finished in {elapsed:.0f}s  |  ID: {talk_id}")
    else:
        _log(f"Talk {talk_index} failed or was skipped.")


# ── Block 3: Voice Pack ────────────────────────────────────────────────────

async def run_voice_pack() -> None:
    """
    Voice Pack pipeline:
      load source_posts from Supabase → structural pass (Python) → semantic pass (gpt-4o) → save
    """
    supabase = get_supabase()

    existing = supabase.table("voice_pack").select("id, extracted_at").execute()
    if existing.data:
        _log(f"SKIP — voice_pack already exists (extracted_at: {existing.data[0]['extracted_at']})")
        _log("To re-extract, delete the row in Supabase and re-run.")
        return

    _log("Loading source_posts from Supabase...")
    posts_result = supabase.table("source_posts").select("platform, raw_text").execute()
    posts = posts_result.data

    if not posts:
        _log("ERROR: No source_posts found. Run: python scripts/seed_data.py --posts")
        return

    _log(f"Loaded {len(posts)} posts")

    _log("Step 1/2: Structural + Semantic pass...")
    t0 = time.time()
    structural, semantic = await extract_voice_pack(posts)
    _log(f"Done in {time.time() - t0:.1f}s")

    _log(f"  avg_post_length_words:     {structural.avg_post_length_words}")
    _log(f"  avg_sentence_length_words: {structural.avg_sentence_length_words}")
    _log(f"  emoji_density:             {structural.emoji_density}")
    _log(f"  hashtag_density:           {structural.hashtag_density}")
    _log(f"  opening_word_patterns:     {structural.opening_word_patterns}")
    _log(f"  tone_descriptors:          {semantic.tone_descriptors}")
    _log(f"  formality_level:           {semantic.formality_level}")
    _log(f"  top_5_hook_patterns:       {semantic.top_5_hook_patterns}")

    _log("Step 2/2: Saving voice_pack to Supabase...")
    result = supabase.table("voice_pack").insert({
        "structural_profile": structural.model_dump(),
        "semantic_profile": semantic.model_dump(),
        "source_post_count": len(posts),
        "sample_count": len(posts),
    }).execute()

    voice_pack_id = result.data[0]["id"]
    _log(f"✓ voice_pack saved — ID: {voice_pack_id}")


# ── Block 4: Forge + Score ─────────────────────────────────────────────────

async def run_forge_and_score(talk_id: str | None = None) -> None:
    """
    Forge + Score pipeline (Block 4):
      Load insights → forge briefs (gpt-4o-mini) → score on 6 axes (gpt-4o-mini) → save to Supabase.

    If talk_id is provided, only processes that specific talk.
    Otherwise processes all completed talks that have no briefs yet.

    Cost estimate: ~$0.65 for all 3 talks (~240 briefs × forge + score).
    """
    from app.pipeline.forge import forge_all_briefs
    from app.pipeline.score import score_all_briefs
    from app.models.schemas import InsightUnit, SemanticProfile

    supabase = get_supabase()

    # ── Load voice_pack (semantic profile for voice conformance) ───────────
    _log("Loading voice_pack from Supabase...")
    vp_result = supabase.table("voice_pack").select("semantic_profile").execute()
    if not vp_result.data:
        _log("ERROR: No voice_pack found. Run: python scripts/run_pipeline.py --voice")
        return

    semantic_profile = SemanticProfile.model_validate(vp_result.data[0]["semantic_profile"])
    _log(f"Voice pack loaded: tone={semantic_profile.tone_descriptors[:2]}, "
         f"formality={semantic_profile.formality_level}/10")

    # ── Determine which talks to process ──────────────────────────────────
    if talk_id:
        talks_result = (
            supabase.table("talks")
            .select("id, title, youtube_url")
            .eq("id", talk_id)
            .eq("status", "completed")
            .execute()
        )
    else:
        talks_result = (
            supabase.table("talks")
            .select("id, title, youtube_url")
            .eq("status", "completed")
            .execute()
        )

    talks = talks_result.data
    if not talks:
        _log("No completed talks found. Run the ingest pipeline first.")
        return

    _log(f"Found {len(talks)} completed talk(s).")
    total_briefs_saved = 0

    for talk in talks:
        _hr(f"Forging: {talk['title']}")

        # ── Load insights for this talk ────────────────────────────────────
        insights_result = (
            supabase.table("insights")
            .select("id, claim, evidence, speaker_quote, timestamp_start, "
                    "timestamp_end, novelty_score, evidence_density, journey_stages")
            .eq("talk_id", talk["id"])
            .execute()
        )

        if not insights_result.data:
            _log(f"SKIP — No insights found for talk: {talk['title']}")
            continue

        # ── Idempotency: skip if regular (non-special) briefs already exist ──
        insight_ids = [row["id"] for row in insights_result.data]

        # Exclude trend_match and time_machine briefs from the count — those are
        # inserted by other pipeline steps and must not block the forge.
        existing_briefs_result = (
            supabase.table("briefs")
            .select("id", count="exact")
            .in_("insight_id", insight_ids)
            .eq("is_trend_match", False)
            .eq("is_time_machine", False)
            .execute()
        )

        if existing_briefs_result.data:
            count = len(existing_briefs_result.data)
            _log(f"SKIP — {count} regular briefs already exist for '{talk['title']}'.")
            _log("  → To re-forge, delete regular briefs for this talk in Supabase first.")
            total_briefs_saved += count
            continue

        # ── Reconstruct InsightUnit objects from Supabase rows ─────────────
        insights_with_ids: list[tuple[InsightUnit, str]] = []
        for row in insights_result.data:
            insight = InsightUnit(
                claim=row["claim"],
                evidence=row["evidence"],
                speaker_quote=row.get("speaker_quote"),
                timestamp_start=float(row.get("timestamp_start") or 0.0),
                timestamp_end=float(row.get("timestamp_end") or 0.0),
                novelty_score=int(row.get("novelty_score") or 5),
                evidence_density=int(row.get("evidence_density") or 5),
                journey_stages=row.get("journey_stages") or [],
            )
            insights_with_ids.append((insight, row["id"]))

        n_insights = len(insights_with_ids)
        n_stages_avg = sum(
            len([s for s in ins.journey_stages if s])
            for ins, _ in insights_with_ids
        ) / max(n_insights, 1)
        expected_briefs = int(n_insights * max(1, n_stages_avg) * 4)
        _log(f"{n_insights} insights | ~{n_stages_avg:.1f} stages/insight | "
             f"~{expected_briefs} briefs expected")

        # ── Step 1: Forge ──────────────────────────────────────────────────
        _log(f"Step 1/2: Forging briefs with {settings.gpt4o_mini_deployment} (gpt-4o-mini)...")
        t0 = time.time()
        briefs = await forge_all_briefs(
            insights_with_ids=insights_with_ids,
            talk_youtube_url=talk["youtube_url"],
            semantic_profile=semantic_profile,
        )
        elapsed = time.time() - t0
        _log(f"Forged {len(briefs)} briefs in {elapsed:.1f}s "
             f"({elapsed / len(briefs):.2f}s/brief)")

        # ── Step 2: Score ──────────────────────────────────────────────────
        _log("Step 2/2: Scoring with 6-axis Resonance Rubric...")
        t0 = time.time()
        scored_briefs = await score_all_briefs(briefs)
        elapsed = time.time() - t0
        _log(f"Scored {len(scored_briefs)} briefs in {elapsed:.1f}s")

        scores = [b.resonance_score for b in scored_briefs if b.resonance_score is not None]
        if scores:
            avg_score = sum(scores) / len(scores)
            min_score = min(scores)
            max_score = max(scores)
            _log(f"Resonance scores — avg: {avg_score:.1f}/100 | "
                 f"min: {min_score} | max: {max_score}")

        # ── Save to Supabase ───────────────────────────────────────────────
        _log(f"Saving {len(scored_briefs)} briefs to Supabase...")

        def _clean(v):
            """Strip null bytes that Postgres rejects in text columns."""
            if isinstance(v, str):
                return v.replace("\x00", "").replace("\u0000", "")
            if isinstance(v, dict):
                return {k: _clean(val) for k, val in v.items()}
            if isinstance(v, list):
                return [_clean(item) for item in v]
            return v

        brief_rows = []
        for brief in scored_briefs:
            brief_rows.append(_clean({
                "insight_id": brief.insight_id,
                "platform": brief.platform.value,
                "journey_stage": brief.journey_stage.value,
                "hook": brief.hook,
                "body": brief.body,
                "structured_payload": brief.structured_payload,
                "suggested_visuals": brief.suggested_visuals,
                "cta": brief.cta,
                "source_timestamp_start": brief.source_timestamp_start,
                "source_timestamp_end": brief.source_timestamp_end,
                "resonance_score": brief.resonance_score,
                "score_breakdown": (
                    brief.score_breakdown.model_dump()
                    if brief.score_breakdown else None
                ),
                "is_time_machine": brief.is_time_machine,
                "is_trend_match": brief.is_trend_match,
            }))

        BATCH = 50
        for i in range(0, len(brief_rows), BATCH):
            supabase.table("briefs").insert(brief_rows[i:i + BATCH]).execute()

        _log(f"✓ {len(brief_rows)} briefs saved for: {talk['title']}")
        total_briefs_saved += len(brief_rows)

    _hr()
    _log(f"✓ Block 4 complete — {total_briefs_saved} total briefs in Supabase")


async def run_score_only() -> None:
    """
    Re-score existing briefs that are missing a resonance_score.
    Useful if scoring failed mid-run or you want to update scores.
    """
    from app.pipeline.score import score_all_briefs
    from app.models.schemas import BriefCreate
    from app.models.enums import Platform, JourneyStage

    supabase = get_supabase()

    _log("Loading unscored briefs from Supabase...")
    result = (
        supabase.table("briefs")
        .select("id, insight_id, platform, journey_stage, hook, body, cta, "
                "source_timestamp_start, source_timestamp_end")
        .is_("resonance_score", "null")
        .execute()
    )

    if not result.data:
        _log("All briefs are already scored.")
        return

    _log(f"Found {len(result.data)} unscored briefs. Scoring...")

    briefs: list[BriefCreate] = []
    brief_ids: list[str] = []
    for row in result.data:
        try:
            b = BriefCreate(
                insight_id=row["insight_id"],
                platform=Platform(row["platform"]),
                journey_stage=JourneyStage(row["journey_stage"]),
                hook=row["hook"],
                body=row["body"],
                cta=row.get("cta"),
                source_timestamp_start=row.get("source_timestamp_start"),
                source_timestamp_end=row.get("source_timestamp_end"),
            )
            briefs.append(b)
            brief_ids.append(row["id"])
        except Exception as exc:
            _log(f"WARN: Skipping brief {row['id']}: {exc}")

    t0 = time.time()
    scored = await score_all_briefs(briefs)
    _log(f"Scored {len(scored)} briefs in {time.time() - t0:.1f}s")

    updated = 0
    for brief, brief_id in zip(scored, brief_ids):
        supabase.table("briefs").update({
            "resonance_score": brief.resonance_score,
            "score_breakdown": (
                brief.score_breakdown.model_dump()
                if brief.score_breakdown else None
            ),
        }).eq("id", brief_id).execute()
        updated += 1

    _log(f"✓ {updated} briefs re-scored and updated in Supabase")


# ── Block 5: Trend Hijacker ────────────────────────────────────────────────

async def run_trends() -> None:
    """
    Trend Hijacker pipeline (Block 5):
      Load trend_headlines.json → embed each headline → vector search in insights
      → generate bridge post (gpt-4o-mini) → save to trend_matches + briefs tables.
    """
    import json as _json
    from app.pipeline.trends import embed_headline, find_matching_insight, generate_bridge_post
    from app.models.schemas import TrendHeadline, SemanticProfile
    from app.models.enums import Platform, JourneyStage

    supabase = get_supabase()

    # ── Load trend headlines ───────────────────────────────────────────────
    headlines_path = Path(__file__).parent.parent / "seeds" / "trend_headlines.json"
    if not headlines_path.exists():
        _log(f"ERROR: {headlines_path} not found. Create the seed file first.")
        return

    headlines_raw = _json.loads(headlines_path.read_text(encoding="utf-8"))
    headlines = [TrendHeadline.model_validate(h) for h in headlines_raw]
    _log(f"Loaded {len(headlines)} trend headline(s).")

    # ── Load voice_pack ────────────────────────────────────────────────────
    vp_result = supabase.table("voice_pack").select("semantic_profile").execute()
    semantic_profile = None
    if vp_result.data:
        from app.models.schemas import SemanticProfile as SP
        semantic_profile = SP.model_validate(vp_result.data[0]["semantic_profile"])

    # ── Idempotency: skip headlines already in trend_matches ──────────────
    existing_headlines = {
        row["headline"]
        for row in supabase.table("trend_matches").select("headline").execute().data
    }

    for headline in headlines:
        _hr(f"Headline: {headline.headline[:60]}...")

        if headline.headline in existing_headlines:
            _log("SKIP — already processed.")
            continue

        # ── Step 1: Embed headline ─────────────────────────────────────────
        _log("Step 1/4: Embedding headline...")
        embedding = await embed_headline(headline.headline)

        # ── Step 2: Vector search ──────────────────────────────────────────
        _log("Step 2/4: Vector search for matching insight...")
        matched = await find_matching_insight(embedding)

        if not matched:
            _log(f"No matching insight above threshold. Saving unmatched row.")
            supabase.table("trend_matches").insert({
                "headline": headline.headline,
                "source_publication": headline.source_publication,
                "source_url": headline.source_url,
                "matched_insight_id": None,
                "similarity_score": None,
                "bridge_post_text": None,
            }).execute()
            continue

        similarity = matched.get("similarity", 0)
        _log(f"Matched insight (similarity={similarity:.3f}): {matched.get('claim', '')[:80]}")

        # ── Step 3: Generate bridge post ───────────────────────────────────
        _log("Step 3/4: Generating bridge post (gpt-4o-mini)...")
        bridge = await generate_bridge_post(
            headline=headline,
            matched_insight=matched,
            semantic_profile=semantic_profile,
        )
        _log(f"Bridge hook: {bridge.hook[:80]}")

        # ── Step 4: Save trend_match + brief ──────────────────────────────
        _log("Step 4/4: Saving to Supabase...")

        tm_result = supabase.table("trend_matches").insert({
            "headline": headline.headline,
            "source_publication": headline.source_publication,
            "source_url": headline.source_url,
            "matched_insight_id": matched["id"],
            "similarity_score": similarity,
            "bridge_post_text": f"{bridge.hook}\n\n{bridge.body}",
        }).execute()
        tm_id = tm_result.data[0]["id"]
        _log(f"  trend_match saved — ID: {tm_id}")

        # Create a brief row with is_trend_match=True (LinkedIn by default)
        # Use journey_stages from the matched insight if available
        stages = matched.get("journey_stages") or []
        stage_val = stages[0] if stages else "curious_explorer"
        try:
            jstage = JourneyStage(stage_val)
        except ValueError:
            jstage = JourneyStage.curious_explorer

        supabase.table("briefs").insert({
            "insight_id": matched["id"],
            "platform": Platform.linkedin.value,
            "journey_stage": jstage.value,
            "hook": bridge.hook,
            "body": bridge.body,
            "cta": "Síguenos en EPIC Lab para más insights de fundadores.",
            "source_timestamp_start": matched.get("timestamp_start"),
            "source_timestamp_end": matched.get("timestamp_end"),
            "is_trend_match": True,
            "is_time_machine": False,
        }).execute()
        _log(f"  brief row saved (is_trend_match=True, platform=linkedin)")

    _hr()
    _log("✓ Block 5 complete — trend_matches and brief rows saved.")


# ── Block 5.5: Time Machine ────────────────────────────────────────────────

async def run_time_machine() -> None:
    """
    Time Machine card (Block 5.5):
      Load seeds/time_machine.json → find matching talk + insight → insert brief
      with is_time_machine=True.
    """
    import json as _json
    from app.models.enums import Platform, JourneyStage
    import re

    supabase = get_supabase()

    # ── Load time_machine seed ─────────────────────────────────────────────
    tm_path = Path(__file__).parent.parent / "seeds" / "time_machine.json"
    if not tm_path.exists():
        _log(f"ERROR: {tm_path} not found.")
        return

    data = _json.loads(tm_path.read_text(encoding="utf-8"))
    _log(f"Time Machine: {data.get('note', 'no note')}")

    # ── Idempotency check ──────────────────────────────────────────────────
    existing = (
        supabase.table("briefs")
        .select("id")
        .eq("is_time_machine", True)
        .execute()
    )
    if existing.data:
        _log(f"SKIP — {len(existing.data)} Time Machine brief(s) already exist.")
        return

    # ── Find the talk by youtube_url ───────────────────────────────────────
    youtube_url = data.get("talk_youtube_url", "")
    clean_url = re.sub(r"[&?]t=\d+s?", "", youtube_url).rstrip("?&")

    talk_result = (
        supabase.table("talks")
        .select("id, title")
        .eq("youtube_url", clean_url)
        .execute()
    )
    if not talk_result.data:
        _log(f"ERROR: Talk not found for URL: {clean_url}")
        _log("  → Run ingest pipeline first, or check the youtube_url in time_machine.json")
        return

    talk = talk_result.data[0]
    _log(f"Talk: {talk['title']}")

    # ── Find the closest insight by timestamp ──────────────────────────────
    ts_start = float(data.get("timestamp_start", 0))
    ts_end = float(data.get("timestamp_end", 0))

    insights_result = (
        supabase.table("insights")
        .select("id, claim, timestamp_start, timestamp_end, journey_stages")
        .eq("talk_id", talk["id"])
        .execute()
    )

    if not insights_result.data:
        _log("ERROR: No insights found for this talk.")
        return

    # Find insight whose timestamp range overlaps most with the seed timestamps
    def overlap(row):
        r_start = row.get("timestamp_start") or 0
        r_end = row.get("timestamp_end") or 0
        overlap_start = max(r_start, ts_start)
        overlap_end = min(r_end, ts_end)
        return max(0, overlap_end - overlap_start)

    best_insight = max(insights_result.data, key=overlap)
    _log(f"Best matching insight: {best_insight['claim'][:80]}")
    _log(f"  timestamp: {best_insight.get('timestamp_start')}s — {best_insight.get('timestamp_end')}s")

    # ── Build the brief ────────────────────────────────────────────────────
    hook = data.get("brief_hook", "")
    body = data.get("brief_body", "")
    stages = best_insight.get("journey_stages") or []
    stage_val = stages[0] if stages else "ecosystem_leader"
    try:
        jstage = JourneyStage(stage_val)
    except ValueError:
        jstage = JourneyStage.ecosystem_leader

    # ── Insert brief row ───────────────────────────────────────────────────
    _log("Inserting Time Machine brief into Supabase...")
    result = supabase.table("briefs").insert({
        "insight_id": best_insight["id"],
        "platform": Platform.linkedin.value,
        "journey_stage": jstage.value,
        "hook": hook,
        "body": body,
        "cta": "Sigue a EPIC Lab para ver más momentos como este.",
        "source_timestamp_start": ts_start,
        "source_timestamp_end": ts_end,
        "resonance_score": 90,       # Hand-curated — highest quality content
        "score_breakdown": {
            "hook_strength": 9,
            "evidence_density": 9,
            "voice_conformance": 9,
            "platform_format_fit": 9,
            "journey_stage_clarity": 9,
            "novelty": 9,
            "hook_strength_reason": "El gancho conecta pasado y presente con precisión narrativa.",
            "evidence_density_reason": "Incluye valuación real ($2,000 MDD) y resultado verificable.",
            "voice_conformance_reason": "Voz directa y basada en evidencia, característica de EPIC Lab.",
            "platform_format_fit_reason": "Formato LinkedIn con hook, contexto y resolución. Perfecto.",
            "journey_stage_clarity_reason": "Orientado a líderes del ecosistema que valoran la visión.",
            "novelty_reason": "El framing Then & Now es único en el corpus de EPIC Lab.",
        },
        "is_time_machine": True,
        "is_trend_match": False,
    }).execute()

    brief_id = result.data[0]["id"]
    _log(f"✓ Time Machine brief saved — ID: {brief_id}")
    _log(f"  hook: {hook[:80]}")
    _hr()
    _log("✓ Block 5.5 complete.")


# ── Main ───────────────────────────────────────────────────────────────────

async def main() -> None:
    parser = argparse.ArgumentParser(description="EPIC Echo pipeline runner")

    # Block 2 flags
    parser.add_argument("--talk", type=int, choices=[1, 2, 3],
                        help="Process a specific demo talk by index (1, 2, or 3)")
    parser.add_argument("--all", action="store_true",
                        help="Process all 3 demo talks sequentially")
    parser.add_argument("--url", type=str,
                        help="Process any YouTube URL")

    # Block 3 flag
    parser.add_argument("--voice", action="store_true",
                        help="Extract voice pack from source_posts in Supabase")

    # Block 4 flags
    parser.add_argument("--forge", action="store_true",
                        help="Generate + score briefs for all completed talks (or --talk N)")
    parser.add_argument("--score", action="store_true",
                        help="Re-score existing briefs that are missing a resonance_score")

    # Block 5 flag
    parser.add_argument("--trends", action="store_true",
                        help="Run Trend Hijacker: embed headlines, match to insights, generate bridge posts")

    # Block 5.5 flag
    parser.add_argument("--time-machine", action="store_true",
                        help="Insert Time Machine card brief from seeds/time_machine.json")

    args = parser.parse_args()

    # Validate config
    if not settings.azure_openai_api_key:
        _log("ERROR: AZURE_OPENAI_API_KEY not set. Check backend/.env")
        sys.exit(1)
    if not settings.supabase_url:
        _log("ERROR: SUPABASE_URL not set. Check backend/.env")
        sys.exit(1)

    _log(f"Azure endpoint:         {settings.azure_openai_endpoint}")
    _log(f"GPT-4o deployment:      {settings.gpt4o_deployment}")
    _log(f"GPT-4o-mini deployment: {settings.gpt4o_mini_deployment}")
    _log(f"Whisper deployment:     {settings.whisper_deployment}")
    _log(f"Embedding deployment:   {settings.embedding_deployment}")
    _log(f"Supabase project:       {settings.supabase_url}")
    _hr()

    # ── Block 4: Forge + Score ─────────────────────────────────────────────
    if args.forge:
        _hr("Block 4 — Forge + Score")
        if args.talk:
            # Get the talk_id for the specified index
            supabase = get_supabase()
            url = DEMO_TALKS[args.talk - 1]
            import re
            clean_url = re.sub(r"[&?]t=\d+s?", "", url).rstrip("?&")
            result = (
                supabase.table("talks")
                .select("id, title")
                .eq("youtube_url", clean_url)
                .execute()
            )
            if not result.data:
                _log(f"ERROR: Talk {args.talk} not found in Supabase. Run ingest first.")
                return
            talk_id = result.data[0]["id"]
            _log(f"Forging briefs for Talk {args.talk}: {result.data[0]['title']}")
            await run_forge_and_score(talk_id=talk_id)
        else:
            _log("Forging briefs for ALL completed talks...")
            await run_forge_and_score(talk_id=None)
        return

    if args.score:
        _hr("Block 4 — Re-score Briefs")
        await run_score_only()
        return

    # ── Block 5: Trend Hijacker ────────────────────────────────────────────
    if args.trends:
        _hr("Block 5 — Trend Hijacker")
        await run_trends()
        return

    # ── Block 5.5: Time Machine ────────────────────────────────────────────
    if getattr(args, "time_machine", False):
        _hr("Block 5.5 — Time Machine")
        await run_time_machine()
        return

    # ── Block 3: Voice Pack ────────────────────────────────────────────────
    if args.voice:
        _hr("Block 3 — Voice Pack")
        await run_voice_pack()
        return

    # ── Block 2: Ingest ────────────────────────────────────────────────────
    if args.url:
        _hr("Custom URL")
        await ingest_talk(args.url)
    elif args.talk:
        await process_by_index(args.talk)
    elif args.all:
        for i in range(1, len(DEMO_TALKS) + 1):
            await process_by_index(i)
            if i < len(DEMO_TALKS):
                _log("Pausing 5s before next talk...")
                await asyncio.sleep(5)
    else:
        parser.print_help()
        print("\nDemo talk URLs:")
        for i, url in enumerate(DEMO_TALKS, 1):
            print(f"  Talk {i}: {url}")


if __name__ == "__main__":
    asyncio.run(main())
