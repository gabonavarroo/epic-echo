"""
Pipeline step 3: Generate editor-ready briefs for each (insight × stage × platform).

Model: gpt-4o (all briefs are generated with this model).
Concurrency: Semaphore(8) caps parallel API calls to avoid rate-limit errors.
Language: Spanish — all briefs output in Spanish for EPIC Lab's ITAM audience.
"""
from __future__ import annotations
import asyncio
import json

from openai import AsyncAzureOpenAI

from app.config import settings
from app.models.enums import Platform, JourneyStage
from app.models.schemas import InsightUnit, BriefCreate, SemanticProfile
from app.prompts.forge import build_forge_messages, get_brief_schema


async def forge_brief(
    insight: InsightUnit,
    insight_id: str,
    talk_youtube_url: str,
    platform: Platform,
    stage: JourneyStage,
    semantic_profile: SemanticProfile | None,
    semaphore: asyncio.Semaphore,
) -> BriefCreate:
    """Generate one brief for a given insight × stage × platform combination."""
    async with semaphore:
        # Pacing delay to stay within Azure rate limits
        await asyncio.sleep(0.6)

        client = AsyncAzureOpenAI(
            api_key=settings.azure_openai_api_key,
            azure_endpoint=settings.azure_openai_endpoint,
            api_version=settings.azure_openai_api_version,
            max_retries=6,  # exponential back-off on 429s
        )

        messages = build_forge_messages(
            insight=insight,
            platform=platform,
            stage=stage,
            semantic_profile=semantic_profile,
        )

        schema = get_brief_schema(platform)

        response = await client.chat.completions.create(
            model=settings.gpt4o_mini_deployment,
            messages=messages,
            response_format={
                "type": "json_schema",
                "json_schema": schema,
            },
        )

        raw = json.loads(response.choices[0].message.content)

        return BriefCreate(
            insight_id=insight_id,
            platform=platform,
            journey_stage=stage,
            hook=raw["hook"],
            body=raw["body"],
            structured_payload=raw.get("structured_payload"),
            suggested_visuals=raw.get("suggested_visuals"),
            cta=raw.get("cta"),
            source_timestamp_start=insight.timestamp_start,
            source_timestamp_end=insight.timestamp_end,
        )


async def forge_all_briefs(
    insights_with_ids: list[tuple[InsightUnit, str]],
    talk_youtube_url: str,
    semantic_profile: SemanticProfile | None,
) -> list[BriefCreate]:
    """
    Generate briefs for all insights × their tagged stages × all 4 platforms.

    Strategy (per plan §2.2):
      - Each insight is tagged with 1-2 journey_stages during extraction.
      - Forge only generates briefs for (insight × tagged_stages × all_4_platforms).
      - Result: ~10 insights × ~2 stages × 4 platforms = ~80 briefs per talk.
    """
    semaphore = asyncio.Semaphore(2)  # 2 concurrent to stay within Azure RPM limits
    tasks = []

    for insight, insight_id in insights_with_ids:
        stages = [
            JourneyStage(s)
            for s in insight.journey_stages
            if s in JourneyStage._value2member_map_
        ]
        if not stages:
            # Fallback: assign first two stages if extraction didn't tag any
            stages = [JourneyStage.curious_explorer, JourneyStage.first_builder]

        for stage in stages:
            for platform in Platform:
                tasks.append(
                    forge_brief(
                        insight=insight,
                        insight_id=insight_id,
                        talk_youtube_url=talk_youtube_url,
                        platform=platform,
                        stage=stage,
                        semantic_profile=semantic_profile,
                        semaphore=semaphore,
                    )
                )

    return await asyncio.gather(*tasks)
