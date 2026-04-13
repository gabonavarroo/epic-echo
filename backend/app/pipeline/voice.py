"""
Pipeline step: Extract EPIC Lab voice pack from source posts.
"""
from __future__ import annotations
import json
import re
import statistics

from openai import AsyncAzureOpenAI

from app.config import settings
from app.models.schemas import StructuralProfile, SemanticProfile
from app.prompts.voice_semantic import build_voice_messages, VOICE_SCHEMA


def _extract_structural(posts: list[dict]) -> StructuralProfile:
    """Pure Python pass — no LLM. Computes statistical patterns from post text."""
    sentence_lengths: list[float] = []
    post_lengths: list[float] = []
    emoji_counts: list[float] = []
    hashtag_counts: list[float] = []
    opening_words: list[str] = []

    emoji_pattern = re.compile(
        "[\U00010000-\U0010ffff\U0001F300-\U0001F9FF\u2600-\u26FF\u2700-\u27BF]",
        flags=re.UNICODE
    )
    hashtag_pattern = re.compile(r"#\w+")

    for post in posts:
        text = post.get("raw_text", "")
        sentences = re.split(r"(?<=[.!?])\s+", text.strip())
        words = text.split()

        sentence_lengths.extend(len(s.split()) for s in sentences if s.strip())
        post_lengths.append(len(words))
        emoji_counts.append(len(emoji_pattern.findall(text)))
        hashtag_counts.append(len(hashtag_pattern.findall(text)))

        first_word = words[0].strip(".,!?") if words else ""
        if first_word:
            opening_words.append(first_word.lower())

    # Top opening word patterns (top 5 by frequency)
    from collections import Counter
    top_openers = [w for w, _ in Counter(opening_words).most_common(5)]

    return StructuralProfile(
        avg_sentence_length_words=round(statistics.mean(sentence_lengths), 1) if sentence_lengths else 0,
        median_sentence_length_words=round(statistics.median(sentence_lengths), 1) if sentence_lengths else 0,
        avg_post_length_words=round(statistics.mean(post_lengths), 1) if post_lengths else 0,
        emoji_density=round(statistics.mean(emoji_counts), 2) if emoji_counts else 0,
        hashtag_density=round(statistics.mean(hashtag_counts), 2) if hashtag_counts else 0,
        avg_sentences_per_post=round(
            sum(1 for p in posts for _ in re.split(r"(?<=[.!?])\s+", p.get("raw_text", ""))) / max(len(posts), 1), 1
        ),
        opening_word_patterns=top_openers,
        common_punctuation_patterns=[".", "—", ":", "..."],
    )


async def extract_voice_pack(posts: list[dict]) -> tuple[StructuralProfile, SemanticProfile]:
    """Extract structural (Python) + semantic (gpt-4o) voice profiles from posts."""
    structural = _extract_structural(posts)

    client = AsyncAzureOpenAI(
        api_key=settings.azure_openai_api_key,
        azure_endpoint=settings.azure_openai_endpoint,
        api_version=settings.azure_openai_api_version,
    )

    messages = build_voice_messages(posts=posts)
    response = await client.chat.completions.create(
        model=settings.gpt4o_deployment,
        messages=messages,
        response_format={
            "type": "json_schema",
            "json_schema": VOICE_SCHEMA,
        },
    )

    raw = json.loads(response.choices[0].message.content)
    semantic = SemanticProfile.model_validate(raw)

    return structural, semantic
