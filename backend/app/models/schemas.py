from __future__ import annotations
from typing import Optional, Any
from pydantic import BaseModel, Field
from app.models.enums import TalkStatus, Platform, JourneyStage


# ── Transcript ─────────────────────────────────────────────────────────────

class TranscriptSegment(BaseModel):
    start: float
    end: float
    text: str


class Chunk(BaseModel):
    segments: list[TranscriptSegment]
    token_count: int
    chunk_index: int


# ── Insight extraction ─────────────────────────────────────────────────────

class InsightUnit(BaseModel):
    claim: str = Field(description="The core actionable claim from the insight")
    evidence: str = Field(description="Specific supporting evidence or data for the claim")
    speaker_quote: Optional[str] = Field(None, description="Direct quote from the speaker (verbatim)")
    timestamp_start: Optional[float] = Field(None, description="Start timestamp in seconds")
    timestamp_end: Optional[float] = Field(None, description="End timestamp in seconds")
    novelty_score: int = Field(ge=1, le=10, description="How novel/non-obvious this insight is (1-10)")
    evidence_density: int = Field(ge=1, le=10, description="Richness of supporting evidence (1-10)")
    journey_stages: list[str] = Field(default_factory=list, description="Relevant journey stages")


class InsightList(BaseModel):
    insights: list[InsightUnit]


# ── Brief ──────────────────────────────────────────────────────────────────

class CarouselSlide(BaseModel):
    slide_number: int
    headline: str
    body: str
    visual_note: str


class CarouselPayload(BaseModel):
    slides: list[CarouselSlide]
    cover_headline: str
    closing_cta: str


class ShortVideoPayload(BaseModel):
    clip_start: float
    clip_end: float
    caption: str
    hook_overlay: str
    cta_overlay: str
    hashtags: list[str]


class ScoreBreakdown(BaseModel):
    hook_strength: int = Field(ge=1, le=10)
    evidence_density: int = Field(ge=1, le=10)
    voice_conformance: int = Field(ge=1, le=10)
    platform_format_fit: int = Field(ge=1, le=10)
    journey_stage_clarity: int = Field(ge=1, le=10)
    novelty: int = Field(ge=1, le=10)
    hook_strength_reason: str = ""
    evidence_density_reason: str = ""
    voice_conformance_reason: str = ""
    platform_format_fit_reason: str = ""
    journey_stage_clarity_reason: str = ""
    novelty_reason: str = ""


class BriefCreate(BaseModel):
    insight_id: str
    platform: Platform
    journey_stage: JourneyStage
    hook: str
    body: str
    structured_payload: Optional[Any] = None
    suggested_visuals: Optional[str] = None
    cta: Optional[str] = None
    source_timestamp_start: Optional[float] = None
    source_timestamp_end: Optional[float] = None
    resonance_score: Optional[int] = None
    score_breakdown: Optional[ScoreBreakdown] = None
    is_time_machine: bool = False
    is_trend_match: bool = False


# ── Voice Pack ─────────────────────────────────────────────────────────────

class StructuralProfile(BaseModel):
    avg_sentence_length_words: float
    median_sentence_length_words: float
    avg_post_length_words: float
    emoji_density: float
    hashtag_density: float
    avg_sentences_per_post: float
    opening_word_patterns: list[str]
    common_punctuation_patterns: list[str]


class SemanticProfile(BaseModel):
    top_5_hook_patterns: list[str]
    banned_phrases: list[str]
    preferred_phrases: list[str]
    tone_descriptors: list[str]
    cta_patterns: list[str]
    formality_level: int = Field(ge=1, le=10)
    spanish_english_mix_policy: str
    topic_anchors: list[str]


# ── Trend ──────────────────────────────────────────────────────────────────

class TrendHeadline(BaseModel):
    headline: str
    source_publication: Optional[str] = None
    source_url: Optional[str] = None
    publish_date: Optional[str] = None


class BridgePost(BaseModel):
    hook: str
    body: str
    platform: str = "linkedin"
