// TypeScript types mirroring the Pydantic models in backend/app/models/schemas.py
// Keep these in sync with the Supabase schema.

export type TalkStatus = "pending" | "transcribing" | "extracting" | "completed" | "failed";
export type Platform = "linkedin" | "x" | "instagram_carousel" | "short_form_video";
export type JourneyStage = "curious_explorer" | "first_builder" | "growth_navigator" | "ecosystem_leader";

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

export interface Talk {
  id: string;
  youtube_url: string;
  title: string;
  speaker_name: string;
  duration_sec: number | null;
  language: string;
  raw_transcript: TranscriptSegment[] | null;
  status: TalkStatus;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Insight {
  id: string;
  talk_id: string;
  claim: string;
  evidence: string;
  speaker_quote: string | null;
  timestamp_start: number | null;
  timestamp_end: number | null;
  novelty_score: number | null;
  evidence_density: number | null;
  journey_stages: string[];
  created_at: string;
  updated_at: string;
}

export interface CarouselSlide {
  slide_number: number;
  headline: string;
  body: string;
  visual_note: string;
}

export interface CarouselPayload {
  slides: CarouselSlide[];
  cover_headline: string;
  closing_cta: string;
}

export interface ShortVideoPayload {
  clip_start: number;
  clip_end: number;
  caption: string;
  hook_overlay: string;
  cta_overlay: string;
  hashtags: string[];
}

export interface ScoreBreakdown {
  hook_strength: number;
  evidence_density: number;
  voice_conformance: number;
  platform_format_fit: number;
  journey_stage_clarity: number;
  novelty: number;
  hook_strength_reason: string;
  evidence_density_reason: string;
  voice_conformance_reason: string;
  platform_format_fit_reason: string;
  journey_stage_clarity_reason: string;
  novelty_reason: string;
}

export interface Brief {
  id: string;
  insight_id: string;
  platform: Platform;
  journey_stage: JourneyStage;
  hook: string;
  body: string;
  structured_payload: CarouselPayload | ShortVideoPayload | null;
  suggested_visuals: string | null;
  cta: string | null;
  source_timestamp_start: number | null;
  source_timestamp_end: number | null;
  resonance_score: number | null;
  score_breakdown: ScoreBreakdown | null;
  is_time_machine: boolean;
  is_trend_match: boolean;
  created_at: string;
  updated_at: string;
  // Joined fields
  insight?: Insight;
  talk?: Talk;
}

export interface StructuralProfile {
  avg_sentence_length_words: number;
  median_sentence_length_words: number;
  avg_post_length_words: number;
  emoji_density: number;
  hashtag_density: number;
  avg_sentences_per_post: number;
  opening_word_patterns: string[];
  common_punctuation_patterns: string[];
}

export interface SemanticProfile {
  top_5_hook_patterns: string[];
  banned_phrases: string[];
  preferred_phrases: string[];
  tone_descriptors: string[];
  cta_patterns: string[];
  formality_level: number;
  spanish_english_mix_policy: string;
  topic_anchors: string[];
}

export interface VoicePack {
  id: string;
  structural_profile: StructuralProfile;
  semantic_profile: SemanticProfile;
  sample_count: number;
  source_post_count: number;
  extracted_at: string;
  created_at: string;
  updated_at: string;
}

export interface TrendMatch {
  id: string;
  headline: string;
  source_publication: string | null;
  source_url: string | null;
  matched_insight_id: string | null;
  similarity_score: number | null;
  bridge_post_text: string | null;
  created_at: string;
}

// Supabase Database type (for createClient<Database>)
export interface Database {
  public: {
    Tables: {
      talks: { Row: Talk; Insert: Omit<Talk, "id" | "created_at" | "updated_at">; Update: Partial<Talk> };
      insights: { Row: Insight; Insert: Omit<Insight, "id" | "created_at" | "updated_at">; Update: Partial<Insight> };
      briefs: { Row: Brief; Insert: Omit<Brief, "id" | "created_at" | "updated_at">; Update: Partial<Brief> };
      voice_pack: { Row: VoicePack; Insert: Omit<VoicePack, "id" | "created_at" | "updated_at">; Update: Partial<VoicePack> };
      trend_matches: { Row: TrendMatch; Insert: Omit<TrendMatch, "id" | "created_at">; Update: Partial<TrendMatch> };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
