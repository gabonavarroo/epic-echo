"use client";

import { cn } from "@/lib/utils";
import type { SemanticProfile } from "@/lib/types";

interface SemanticCardProps {
  profile: SemanticProfile;
}

// ── Phrase chip ───────────────────────────────────────────────────────────────

function PhraseChip({
  label,
  variant = "neutral",
}: {
  label: string;
  variant?: "preferred" | "banned" | "neutral" | "tone" | "cta";
}) {
  const styles: Record<typeof variant, string> = {
    preferred: "border-emerald-500/30 bg-emerald-500/8 text-emerald-300",
    banned:    "border-red-500/30    bg-red-500/8    text-red-300    line-through decoration-red-500/50",
    tone:      "border-violet-500/30 bg-violet-500/8 text-violet-300",
    cta:       "border-sky-500/30    bg-sky-500/8    text-sky-300",
    neutral:   "border-zinc-700/60   bg-zinc-800/50  text-zinc-300",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-1",
        "text-[12px] font-medium leading-none",
        styles[variant]
      )}
    >
      {label}
    </span>
  );
}

// ── Hook pattern row ──────────────────────────────────────────────────────────

function HookRow({ index, pattern }: { index: number; pattern: string }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-zinc-800/50 last:border-0">
      <span className="flex-none mt-0.5 h-5 w-5 rounded-md bg-zinc-800 text-zinc-500
                       text-[10px] font-bold flex items-center justify-center tabular-nums">
        {index + 1}
      </span>
      <p className="text-[12px] text-zinc-300 leading-relaxed">{pattern}</p>
    </div>
  );
}

// ── Formality meter ───────────────────────────────────────────────────────────

function FormalityMeter({ level }: { level: number }) {
  const clamped = Math.min(10, Math.max(0, level));
  const pct     = clamped * 10;
  const color   =
    clamped >= 7 ? "bg-violet-500" :
    clamped >= 4 ? "bg-emerald-500" :
    "bg-amber-500";

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[12px] tabular-nums font-medium text-zinc-300">
        {clamped}<span className="text-zinc-600">/10</span>
      </span>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SemanticCard({ profile }: SemanticCardProps) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">

      {/* Header */}
      <div className="px-6 pt-5 pb-4 border-b border-zinc-800/60">
        <div className="flex items-center gap-2.5 mb-1">
          <span className="h-2 w-2 rounded-full bg-violet-400 shadow-[0_0_6px_rgba(167,139,250,0.5)]" />
          <h2 className="text-[13px] font-semibold uppercase tracking-widest text-zinc-300">
            Semantic Profile
          </h2>
        </div>
        <p className="text-[12px] text-zinc-500 ml-4.5">
          Voice DNA — patterns, tone, and boundaries
        </p>
      </div>

      <div className="px-6 py-4 flex flex-col gap-6">

        {/* ── Formality + language mix ──────────────────────────────────── */}
        <div className="rounded-xl border border-zinc-800/60 bg-zinc-950/40 px-4 py-3 flex flex-col gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1.5 font-medium">
              Formality Level
            </p>
            <FormalityMeter level={profile.formality_level} />
          </div>
          {profile.spanish_english_mix_policy && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1 font-medium">
                Language Policy
              </p>
              <p className="text-[12px] text-zinc-300 leading-relaxed">
                {profile.spanish_english_mix_policy}
              </p>
            </div>
          )}
        </div>

        {/* ── Tone descriptors ──────────────────────────────────────────── */}
        {profile.tone_descriptors && profile.tone_descriptors.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2 font-medium">
              Tone
            </p>
            <div className="flex flex-wrap gap-1.5">
              {profile.tone_descriptors.map((t, i) => (
                <PhraseChip key={i} label={t} variant="tone" />
              ))}
            </div>
          </div>
        )}

        {/* ── Hook patterns ─────────────────────────────────────────────── */}
        {profile.top_5_hook_patterns && profile.top_5_hook_patterns.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1 font-medium">
              Top Hook Patterns
            </p>
            <div className="rounded-xl border border-zinc-800/60 bg-zinc-950/40 px-4">
              {profile.top_5_hook_patterns.map((p, i) => (
                <HookRow key={i} index={i} pattern={p} />
              ))}
            </div>
          </div>
        )}

        {/* ── Preferred phrases ─────────────────────────────────────────── */}
        {profile.preferred_phrases && profile.preferred_phrases.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2 font-medium">
              Preferred Phrases
            </p>
            <div className="flex flex-wrap gap-1.5">
              {profile.preferred_phrases.map((p, i) => (
                <PhraseChip key={i} label={p} variant="preferred" />
              ))}
            </div>
          </div>
        )}

        {/* ── Banned phrases ────────────────────────────────────────────── */}
        {profile.banned_phrases && profile.banned_phrases.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2 font-medium">
              Banned Phrases
            </p>
            <div className="flex flex-wrap gap-1.5">
              {profile.banned_phrases.map((p, i) => (
                <PhraseChip key={i} label={p} variant="banned" />
              ))}
            </div>
          </div>
        )}

        {/* ── CTA patterns ──────────────────────────────────────────────── */}
        {profile.cta_patterns && profile.cta_patterns.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2 font-medium">
              CTA Patterns
            </p>
            <div className="flex flex-wrap gap-1.5">
              {profile.cta_patterns.map((p, i) => (
                <PhraseChip key={i} label={p} variant="cta" />
              ))}
            </div>
          </div>
        )}

        {/* ── Topic anchors ─────────────────────────────────────────────── */}
        {profile.topic_anchors && profile.topic_anchors.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2 font-medium">
              Topic Anchors
            </p>
            <div className="flex flex-wrap gap-1.5">
              {profile.topic_anchors.map((t, i) => (
                <PhraseChip key={i} label={t} variant="neutral" />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
