"use client";

import { cn } from "@/lib/utils";
import type { StructuralProfile } from "@/lib/types";

interface StructuralCardProps {
  profile: StructuralProfile;
  sampleCount: number;
}

// ── Stat row ─────────────────────────────────────────────────────────────────

function StatRow({
  label,
  value,
  unit,
  accent = false,
}: {
  label: string;
  value: string | number;
  unit?: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-zinc-800/60 last:border-0">
      <span className="text-[12px] text-zinc-400">{label}</span>
      <span
        className={cn(
          "text-[13px] font-medium tabular-nums",
          accent ? "text-emerald-400" : "text-zinc-100"
        )}
      >
        {value}
        {unit && <span className="ml-1 text-[11px] text-zinc-500">{unit}</span>}
      </span>
    </div>
  );
}

// ── Tag chips ────────────────────────────────────────────────────────────────

function TagChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-md border border-zinc-700/60
                     bg-zinc-800/50 px-2 py-0.5 text-[11px] text-zinc-300 font-mono">
      {label}
    </span>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function StructuralCard({
  profile,
  sampleCount,
}: StructuralCardProps) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">

      {/* Header */}
      <div className="px-6 pt-5 pb-4 border-b border-zinc-800/60">
        <div className="flex items-center gap-2.5 mb-1">
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
          <h2 className="text-[13px] font-semibold uppercase tracking-widest text-zinc-300">
            Structural Profile
          </h2>
        </div>
        <p className="text-[12px] text-zinc-500 ml-4.5">
          Quantitative patterns across {sampleCount} source posts
        </p>
      </div>

      <div className="px-6 py-4 flex flex-col gap-6">

        {/* ── Core metrics ──────────────────────────────────────────────── */}
        <div>
          <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2 font-medium">
            Core Metrics
          </p>
          <div className="rounded-xl border border-zinc-800/60 bg-zinc-950/40 px-4">
            <StatRow
              label="Avg post length"
              value={Math.round(profile.avg_post_length_words)}
              unit="words"
              accent
            />
            <StatRow
              label="Avg sentence length"
              value={Math.round(profile.avg_sentence_length_words)}
              unit="words/sentence"
            />
            <StatRow
              label="Median sentence length"
              value={Math.round(profile.median_sentence_length_words)}
              unit="words"
            />
            <StatRow
              label="Sentences per post"
              value={profile.avg_sentences_per_post.toFixed(1)}
              unit="avg"
            />
            <StatRow
              label="Emoji density"
              value={profile.emoji_density.toFixed(2)}
              unit="per post"
              accent
            />
            <StatRow
              label="Hashtag density"
              value={profile.hashtag_density.toFixed(2)}
              unit="per post"
            />
          </div>
        </div>

        {/* ── Opening patterns ──────────────────────────────────────────── */}
        {profile.opening_word_patterns && profile.opening_word_patterns.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2 font-medium">
              Opening Patterns
            </p>
            <div className="flex flex-wrap gap-1.5">
              {profile.opening_word_patterns.map((pattern, i) => (
                <TagChip key={i} label={pattern} />
              ))}
            </div>
          </div>
        )}

        {/* ── Punctuation patterns ──────────────────────────────────────── */}
        {profile.common_punctuation_patterns && profile.common_punctuation_patterns.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2 font-medium">
              Punctuation Patterns
            </p>
            <div className="flex flex-wrap gap-1.5">
              {profile.common_punctuation_patterns.map((p, i) => (
                <TagChip key={i} label={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
