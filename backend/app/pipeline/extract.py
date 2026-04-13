"""
Pipeline step 2: Extract insights from transcript chunks → embed them.
"""
from __future__ import annotations
import asyncio
import json
import traceback

from openai import AsyncAzureOpenAI

from app.config import settings
from app.models.schemas import Chunk, InsightUnit, InsightList
from app.prompts.extraction import build_extraction_messages, INSIGHT_LIST_SCHEMA

# Limit concurrent API calls to avoid Azure rate limits
_EXTRACTION_SEMAPHORE = asyncio.Semaphore(4)   # max 4 parallel gpt-4o calls


async def extract_insights(
    chunks: list[Chunk],
    speaker_name: str,
    talk_title: str,
    batch_size: int = 3,
) -> list[InsightUnit]:
    """
    Extract insights from transcript chunks using gpt-4o structured output.
    Processes batches with limited concurrency to respect Azure rate limits.
    """
    client = AsyncAzureOpenAI(
        api_key=settings.azure_openai_api_key,
        azure_endpoint=settings.azure_openai_endpoint,
        api_version=settings.azure_openai_api_version,
    )

    all_insights: list[InsightUnit] = []
    batches = [chunks[i:i + batch_size] for i in range(0, len(chunks), batch_size)]
    print(f"  Extracting insights from {len(chunks)} chunks in {len(batches)} batches...")

    async def process_batch(batch_idx: int, batch: list[Chunk]) -> list[InsightUnit]:
        async with _EXTRACTION_SEMAPHORE:
            messages = build_extraction_messages(
                chunks=batch,
                speaker_name=speaker_name,
                talk_title=talk_title,
            )
            try:
                response = await client.chat.completions.create(
                    model=settings.gpt4o_deployment,
                    messages=messages,
                    response_format={
                        "type": "json_schema",
                        "json_schema": INSIGHT_LIST_SCHEMA,
                    },
                    temperature=0.2,
                )
                raw = json.loads(response.choices[0].message.content)
                result = InsightList.model_validate(raw)
                usage = response.usage
                print(
                    f"  Batch {batch_idx + 1}/{len(batches)}: "
                    f"{len(result.insights)} insights | "
                    f"tokens: {usage.prompt_tokens}in + {usage.completion_tokens}out"
                )
                return result.insights
            except Exception as e:
                print(f"  Batch {batch_idx + 1} ERROR: {e}")
                traceback.print_exc()
                return []

    results = await asyncio.gather(*[process_batch(i, b) for i, b in enumerate(batches)])
    for batch_insights in results:
        all_insights.extend(batch_insights)

    print(f"  Total insights extracted: {len(all_insights)}")
    return all_insights


async def embed_insights(insights: list[InsightUnit]) -> list[list[float]]:
    """
    Embed insight claim+evidence using text-embedding-3-small.
    Returns list of 1536-dim vectors in the same order as input.
    """
    if not insights:
        return []

    client = AsyncAzureOpenAI(
        api_key=settings.azure_openai_api_key,
        azure_endpoint=settings.azure_openai_endpoint,
        api_version=settings.azure_openai_api_version,
    )

    texts = [f"{ins.claim}\n{ins.evidence}" for ins in insights]

    print(f"  Embedding {len(texts)} insights...")
    response = await client.embeddings.create(
        model=settings.embedding_deployment,
        input=texts,
    )

    embeddings = [item.embedding for item in response.data]
    print(f"  Embeddings done: {len(embeddings[0])}-dim vectors")
    return embeddings
