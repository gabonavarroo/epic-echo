-- EPIC Echo — Supabase Schema
-- Run this in Supabase Dashboard → SQL Editor
-- Project: pnjhwnylacsgfjtyzuxy

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Enums
CREATE TYPE talk_status AS ENUM ('pending', 'transcribing', 'extracting', 'completed', 'failed');
CREATE TYPE platform AS ENUM ('linkedin', 'x', 'instagram_carousel', 'short_form_video');
CREATE TYPE journey_stage AS ENUM ('curious_explorer', 'first_builder', 'growth_navigator', 'ecosystem_leader');

-- ============================================================
-- talks: source content
-- ============================================================
CREATE TABLE talks (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  youtube_url    TEXT NOT NULL UNIQUE,
  title          TEXT NOT NULL,
  speaker_name   TEXT NOT NULL,
  duration_sec   INT,
  language       TEXT DEFAULT 'es',
  raw_transcript JSONB,              -- array of {start, end, text} segments
  status         talk_status DEFAULT 'pending',
  processed_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- insights: atomic units extracted from talks
-- ============================================================
CREATE TABLE insights (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  talk_id          UUID NOT NULL REFERENCES talks(id) ON DELETE CASCADE,
  claim            TEXT NOT NULL,
  evidence         TEXT NOT NULL,
  speaker_quote    TEXT,
  timestamp_start  FLOAT,
  timestamp_end    FLOAT,
  novelty_score    INT CHECK (novelty_score BETWEEN 1 AND 10),
  evidence_density INT CHECK (evidence_density BETWEEN 1 AND 10),
  journey_stages   TEXT[] DEFAULT '{}',
  embedding        VECTOR(1536),
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_insights_talk ON insights(talk_id);
-- ivfflat index for vector search (suitable for <1000 rows)
CREATE INDEX idx_insights_embedding ON insights
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);

-- ============================================================
-- briefs: generated editor-ready briefs
-- ============================================================
CREATE TABLE briefs (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_id             UUID NOT NULL REFERENCES insights(id) ON DELETE CASCADE,
  platform               platform NOT NULL,
  journey_stage          journey_stage NOT NULL,
  hook                   TEXT NOT NULL,
  body                   TEXT NOT NULL,
  structured_payload     JSONB,          -- CarouselPayload or ShortVideoPayload
  suggested_visuals      TEXT,
  cta                    TEXT,
  source_timestamp_start FLOAT,
  source_timestamp_end   FLOAT,
  resonance_score        INT CHECK (resonance_score BETWEEN 0 AND 100),
  score_breakdown        JSONB,          -- ScoreBreakdown model as JSON
  is_time_machine        BOOLEAN DEFAULT false,
  is_trend_match         BOOLEAN DEFAULT false,
  created_at             TIMESTAMPTZ DEFAULT now(),
  updated_at             TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_briefs_insight ON briefs(insight_id);
CREATE INDEX idx_briefs_platform ON briefs(platform);
CREATE INDEX idx_briefs_stage ON briefs(journey_stage);

-- ============================================================
-- voice_pack: extracted EPIC Lab voice profile (single row)
-- ============================================================
CREATE TABLE voice_pack (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  structural_profile JSONB NOT NULL,
  semantic_profile   JSONB NOT NULL,
  sample_count       INT DEFAULT 0,
  source_post_count  INT DEFAULT 0,
  extracted_at       TIMESTAMPTZ DEFAULT now(),
  created_at         TIMESTAMPTZ DEFAULT now(),
  updated_at         TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- trend_matches: Hijacker output
-- ============================================================
CREATE TABLE trend_matches (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  headline           TEXT NOT NULL,
  source_publication TEXT,
  source_url         TEXT,
  matched_insight_id UUID REFERENCES insights(id) ON DELETE SET NULL,
  similarity_score   FLOAT,
  bridge_post_text   TEXT,
  created_at         TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_trends_insight ON trend_matches(matched_insight_id);

-- ============================================================
-- source_posts: scraped EPIC Lab posts for voice extraction
-- ============================================================
CREATE TABLE source_posts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform   TEXT NOT NULL,       -- 'linkedin' or 'instagram' (free text, not the enum)
  raw_text   TEXT NOT NULL,
  scraped_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Vector search RPC function (used by trends.py)
-- ============================================================
CREATE OR REPLACE FUNCTION match_insights(
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (
  id               UUID,
  talk_id          UUID,
  claim            TEXT,
  evidence         TEXT,
  speaker_quote    TEXT,
  timestamp_start  FLOAT,
  timestamp_end    FLOAT,
  journey_stages   TEXT[],
  similarity       FLOAT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    id,
    talk_id,
    claim,
    evidence,
    speaker_quote,
    timestamp_start,
    timestamp_end,
    journey_stages,
    1 - (embedding <=> query_embedding) AS similarity
  FROM insights
  WHERE 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;

-- ============================================================
-- Auto-update updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_talks_updated BEFORE UPDATE ON talks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_insights_updated BEFORE UPDATE ON insights
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_briefs_updated BEFORE UPDATE ON briefs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_voice_pack_updated BEFORE UPDATE ON voice_pack
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
