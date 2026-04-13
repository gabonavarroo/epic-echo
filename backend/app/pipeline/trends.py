"""
Pipeline step: Trend Hijacker — match headlines to insights via vector search.
"""
from __future__ import annotations
import json

from openai import AsyncAzureOpenAI

from app.config import settings
from app.db import get_supabase
from app.models.schemas import TrendHeadline, InsightUnit, SemanticProfile, BridgePost
from app.prompts.bridge import build_bridge_messages, BRIDGE_SCHEMA

SIMILARITY_THRESHOLD = 0.50  # Lowered from 0.70: talks cover founders/strategy, not news


async def embed_headline(headline: str) -> list[float]:
    client = AsyncAzureOpenAI(
        api_key=settings.azure_openai_api_key,
        azure_endpoint=settings.azure_openai_endpoint,
        api_version=settings.azure_openai_api_version,
    )
    response = await client.embeddings.create(
        model=settings.embedding_deployment,
        input=[headline],
    )
    return response.data[0].embedding


async def find_matching_insight(embedding: list[float]) -> dict | None:
    """Vector search in Supabase insights table. Returns the best match above threshold."""
    supabase = get_supabase()

    # Use pgvector cosine similarity via Supabase RPC
    result = supabase.rpc(
        "match_insights",
        {
            "query_embedding": embedding,
            "match_threshold": SIMILARITY_THRESHOLD,
            "match_count": 3,
        },
    ).execute()

    if result.data:
        return result.data[0]
    return None


async def generate_bridge_post(
    headline: TrendHeadline,
    matched_insight: dict,
    semantic_profile: SemanticProfile | None,
) -> BridgePost:
    """Generate a bridge post connecting a trend headline to an insight."""
    client = AsyncAzureOpenAI(
        api_key=settings.azure_openai_api_key,
        azure_endpoint=settings.azure_openai_endpoint,
        api_version=settings.azure_openai_api_version,
        max_retries=6,
    )

    messages = build_bridge_messages(
        headline=headline,
        insight=matched_insight,
        semantic_profile=semantic_profile,
    )

    response = await client.chat.completions.create(
        model=settings.gpt4o_mini_deployment,
        messages=messages,
        response_format={
            "type": "json_schema",
            "json_schema": BRIDGE_SCHEMA,
        },
    )

    raw = json.loads(response.choices[0].message.content)
    return BridgePost.model_validate(raw)
