"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { ScoreBreakdown } from "@/lib/types";

// ── Axis config ───────────────────────────────────────────────────────────────

const AXES = [
  {
    key:       "hook_strength"         as const,
    reasonKey: "hook_strength_reason"  as const,
    label:     "Hook Strength",
    hint:      "Does the first line stop the scroll?",
  },
  {
    key:       "evidence_density"         as const,
    reasonKey: "evidence_density_reason"  as const,
    label:     "Evidence Density",
    hint:      "Is there a specific claim with specific support?",
  },
  {
    key:       "voice_conformance"         as const,
    reasonKey: "voice_conformance_reason"  as const,
    label:     "Voice Conformance",
    hint:      "Does it match the EPIC Lab voice pack?",
  },
  {
    key:       "platform_format_fit"         as const,
    reasonKey: "platform_format_fit_reason"  as const,
    label:     "Platform Fit",
    hint:      "Does it use the platform's native format?",
  },
  {
    key:       "journey_stage_clarity"         as const,
    reasonKey: "journey_stage_clarity_reason"  as const,
    label:     "Stage Clarity",
    hint:      "Is it obvious who this is for?",
  },
  {
    key:       "novelty"         as const,
    reasonKey: "novelty_reason"  as const,
    label:     "Novelty",
    hint:      "Does it say something the corpus hasn't said?",
  },
] as const;

// ── Component ─────────────────────────────────────────────────────────────────

interface ScoreBreakdownPanelProps {
  breakdown:  ScoreBreakdown;
  totalScore: number | null;
}

export default function ScoreBreakdownPanel({
  breakdown,
  totalScore,
}: ScoreBreakdownPanelProps) {
  // Bars animate in after mount — staggered cascade effect
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex flex-col gap-1">
      {/* Total score header */}
      <div className="flex items-baseline gap-2.5 mb-3">
        {totalScore !== null && (
          <span
            className={cn(
              "text-3xl font-bold tabular-nums leading-none",
              totalScore >= 80
                ? "text-emerald-400"
                : totalScore >= 60
                ? "text-yellow-400"
                : "text-orange-400"
            )}
          >
            {totalScore}
            <span className="text-base font-normal text-zinc-400">/100</span>
          </span>
        )}
        <span className="text-[11px] text-zinc-400 uppercase tracking-wide">
          Resonance Score
        </span>
      </div>

      {/* 6 axes */}
      <div className="flex flex-col gap-3.5">
        {AXES.map(({ key, reasonKey, label, hint }, i) => {
          const score  = breakdown[key] as number;
          const reason = breakdown[reasonKey] as string | undefined;
          const pct    = animated ? (score / 10) * 100 : 0;

          const barColor =
            score >= 8
              ? "bg-emerald-400"
              : score >= 6
              ? "bg-yellow-400"
              : "bg-orange-400";

          const scoreColor =
            score >= 8
              ? "text-emerald-400"
              : score >= 6
              ? "text-yellow-400"
              : "text-orange-400";

          return (
            <div key={key} className="flex flex-col gap-1">
              {/* Label row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] font-medium text-zinc-200">
                    {label}
                  </span>
                  <span
                    className="text-[10px] text-zinc-600 hidden"
                    title={hint}
                  >
                    ⓘ
                  </span>
                </div>
                <span
                  className={cn(
                    "text-[12px] font-mono font-semibold tabular-nums",
                    scoreColor
                  )}
                >
                  {score}
                  <span className="text-zinc-700">/10</span>
                </span>
              </div>

              {/* Bar */}
              <div className="h-[3px] rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className={cn("h-full rounded-full", barColor)}
                  style={{
                    width:      `${pct}%`,
                    transition: `width 0.55s ease ${i * 65}ms`,
                  }}
                />
              </div>

              {/* Reason text */}
              {reason && (
                <p className="text-[13px] text-zinc-300 leading-relaxed line-clamp-2">
                  {reason}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
