"""
Pipeline step 4: Score each brief on the 6-axis Resonance Rubric.

Model: gpt-4o-mini (cost-optimized).
Concurrency: Semaphore(8) caps parallel API calls to avoid rate-limit errors.
Composite score: round(mean(6 axes) × 10) → 0-100 scale.
"""
from __future__ import annotations
import asyncio
import json

from openai import AsyncAzureOpenAI

from app.config import settings
from app.models.schemas import BriefCreate, ScoreBreakdown
from app.prompts.scoring import build_scoring_messages, SCORE_SCHEMA


async def score_brief(
    brief: BriefCreate,
    semaphore: asyncio.Semaphore,
) -> BriefCreate:
    """
    Score a brief on 6 axes. Mutates and returns the brief with
    resonance_score and score_breakdown filled.
    """
    async with semaphore:
        await asyncio.sleep(0.3)  # gentle pacing to stay within Azure RPM limits
        client = AsyncAzureOpenAI(
            api_key=settings.azure_openai_api_key,
            azure_endpoint=settings.azure_openai_endpoint,
            api_version=settings.azure_openai_api_version,
            max_retries=6,  # exponential back-off on 429s
        )

        messages = build_scoring_messages(brief=brief)

        response = await client.chat.completions.create(
            model=settings.gpt4o_mini_deployment,
            messages=messages,
            response_format={
                "type": "json_schema",
                "json_schema": SCORE_SCHEMA,
            },
        )

        raw = json.loads(response.choices[0].message.content)

        # Clamp axis values to [1, 10] in case the model returns out-of-range ints
        for key in ["hook_strength", "evidence_density", "voice_conformance",
                    "platform_format_fit", "journey_stage_clarity", "novelty"]:
            raw[key] = max(1, min(10, int(raw[key])))

        breakdown = ScoreBreakdown.model_validate(raw)

        axes = [
            breakdown.hook_strength,
            breakdown.evidence_density,
            breakdown.voice_conformance,
            breakdown.platform_format_fit,
            breakdown.journey_stage_clarity,
            breakdown.novelty,
        ]
        composite = round(sum(axes) / len(axes) * 10)

        brief.score_breakdown = breakdown
        brief.resonance_score = composite
        return brief


async def score_all_briefs(briefs: list[BriefCreate]) -> list[BriefCreate]:
    """Score all briefs concurrently with rate-limiting."""
    semaphore = asyncio.Semaphore(3)  # 3 concurrent to stay within Azure RPM limits
    return await asyncio.gather(*[score_brief(b, semaphore) for b in briefs])
