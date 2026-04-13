"use client";

import { cn, stageLabel, platformLabel, formatTimestamp } from "@/lib/utils";
import { ScoreBadge } from "@/components/shared/score-badge";
import { PlatformBadge } from "@/components/shared/platform-icon";
import type { Brief, Platform, JourneyStage } from "@/lib/types";

// ── Stage styling ─────────────────────────────────────────────────────────────

const STAGE_STYLE: Record<JourneyStage, string> = {
  curious_explorer:   "text-violet-400 bg-violet-400/8  border-violet-400/20",
  first_builder:      "text-blue-400   bg-blue-400/8    border-blue-400/20",
  growth_navigator:   "text-emerald-400 bg-emerald-400/8 border-emerald-400/20",
  ecosystem_leader:   "text-amber-400  bg-amber-400/8   border-amber-400/20",
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface BriefCardProps {
  brief:     Brief;
  groupBy:   "platform" | "stage";
  onClick?:  (brief: Brief) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function BriefCard({ brief, groupBy, onClick }: BriefCardProps) {
  const isTrend   = brief.is_trend_match;
  const isMachine = brief.is_time_machine;

  // Special border: trend = orange glow, time machine = violet glow
  const specialBorder = isTrend
    ? "border-orange-400/40 shadow-[0_0_16px_rgba(251,146,60,0.10)]"
    : isMachine
    ? "border-violet-400/40 shadow-[0_0_16px_rgba(167,139,250,0.10)]"
    : "border-zinc-800/70 hover:border-zinc-700";

  const specialGlow = isTrend
    ? "hover:border-orange-400/60"
    : isMachine
    ? "hover:border-violet-400/60"
    : "hover:border-zinc-600";

  return (
    <article
      onClick={() => onClick?.(brief)}
      role={onClick ? "button" : undefined}
      className={cn(
        "group flex flex-col gap-3 rounded-xl border bg-zinc-900/70 p-4",
        "transition-all duration-200 ease-out",
        "hover:bg-zinc-900 hover:-translate-y-px",
        onClick && "cursor-pointer",
        specialBorder,
        specialGlow
      )}
    >
      {/* ── Special badge strip ────────────────────────────────────────────── */}
      {(isTrend || isMachine) && (
        <div className="flex items-center gap-1.5">
          {isTrend && (
            <span className="flex items-center gap-1 rounded-md border border-orange-400/30
                             bg-orange-400/10 px-1.5 py-0.5 text-[10px] font-semibold
                             uppercase tracking-wide text-orange-400">
              🔥 Trending Match
            </span>
          )}
          {isMachine && (
            <span className="flex items-center gap-1 rounded-md border border-violet-400/30
                             bg-violet-400/10 px-1.5 py-0.5 text-[10px] font-semibold
                             uppercase tracking-wide text-violet-400">
              🔮 Then &amp; Now
            </span>
          )}
        </div>
      )}

      {/* ── Hook text ─────────────────────────────────────────────────────── */}
      <p className="text-[13px] font-medium leading-snug text-zinc-100 line-clamp-3
                    group-hover:text-white transition-colors">
        {brief.hook}
      </p>

      {/* ── Body preview ─────────────────────────────────────────────────── */}
      {brief.body && (
        <p className="text-[12px] text-zinc-500 leading-relaxed line-clamp-2">
          {brief.body}
        </p>
      )}

      {/* ── Footer row ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mt-auto pt-1
                      border-t border-zinc-800/60">

        {/* Left: platform OR stage badge (opposite of groupBy) */}
        <div className="flex items-center gap-1.5">
          {groupBy === "platform" ? (
            // Grouped by platform → show stage
            <span
              className={cn(
                "inline-flex items-center rounded-md border px-1.5 py-0.5",
                "text-[10px] font-medium",
                STAGE_STYLE[brief.journey_stage as JourneyStage]
              )}
            >
              {stageLabel(brief.journey_stage as JourneyStage)
                .split(" ")
                .map((w) => w[0])
                .join("")}
              <span className="ml-0.5 hidden xl:inline">
                {stageLabel(brief.journey_stage as JourneyStage).split(" ").slice(1).join(" ")}
              </span>
            </span>
          ) : (
            // Grouped by stage → show platform
            <PlatformBadge platform={brief.platform as Platform} size="sm" />
          )}

          {/* Source timestamp hint */}
          {brief.source_timestamp_start !== null && (
            <span className="text-[10px] text-zinc-600 tabular-nums">
              @ {formatTimestamp(brief.source_timestamp_start)}
            </span>
          )}
        </div>

        {/* Right: score badge */}
        <ScoreBadge score={brief.resonance_score} size="sm" />
      </div>
    </article>
  );
}
