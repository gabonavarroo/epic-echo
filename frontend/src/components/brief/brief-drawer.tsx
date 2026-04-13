"use client";

import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { PlatformBadge } from "@/components/shared/platform-icon";
import { ScoreBadge }     from "@/components/shared/score-badge";
import VideoPlayer        from "./video-player";
import ScoreBreakdownPanel from "./score-breakdown";
import CarouselPreview    from "./carousel-preview";
import PublishBar         from "./publish-bar";
import { cn, stageLabel, formatTimestamp } from "@/lib/utils";
import type {
  Brief,
  Platform,
  JourneyStage,
  CarouselPayload,
} from "@/lib/types";

// ── Stage badge styles ────────────────────────────────────────────────────────

const STAGE_STYLE: Record<JourneyStage, string> = {
  curious_explorer: "text-violet-400 bg-violet-400/8 border-violet-400/20",
  first_builder:    "text-blue-400   bg-blue-400/8   border-blue-400/20",
  growth_navigator: "text-emerald-400 bg-emerald-400/8 border-emerald-400/20",
  ecosystem_leader: "text-amber-400  bg-amber-400/8  border-amber-400/20",
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface BriefDrawerProps {
  brief:      Brief | null;
  open:       boolean;
  onClose:    () => void;
  youtubeUrl: string;
}

// ── Drawer shell ─────────────────────────────────────────────────────────────

export default function BriefDrawer({
  brief,
  open,
  onClose,
  youtubeUrl,
}: BriefDrawerProps) {
  return (
    <Sheet
      open={open}
      onOpenChange={(isOpen: boolean) => {
        if (!isOpen) onClose();
      }}
    >
      <SheetContent
        side="right"
        showCloseButton={false}
        className="!w-[580px] !max-w-[580px] p-0 gap-0 overflow-hidden
                   border-l border-zinc-800 bg-zinc-950 flex flex-col"
      >
        {/* Keyed on brief.id → full remount (score bars re-animate) each time */}
        {brief && (
          <DrawerBody
            key={brief.id}
            brief={brief}
            onClose={onClose}
            youtubeUrl={youtubeUrl}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

// ── Inner body (remounts per brief) ──────────────────────────────────────────

function DrawerBody({
  brief,
  onClose,
  youtubeUrl,
}: {
  brief:      Brief;
  onClose:    () => void;
  youtubeUrl: string;
}) {
  const platform     = brief.platform as Platform;
  const stage        = brief.journey_stage as JourneyStage;
  const isCarousel   = platform === "instagram_carousel";
  const carouselPayload =
    isCarousel ? (brief.structured_payload as CarouselPayload) : null;

  return (
    <>
      {/* ── Sticky header ──────────────────────────────────────────────────── */}
      <div className="flex-none border-b border-zinc-800/70 bg-zinc-950/95 backdrop-blur-sm px-5 pt-4 pb-4">

        {/* Top row: close + score */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md
                       text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/70
                       transition-colors duration-150"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              className="h-4 w-4"
            >
              <path d="M2.22 2.22a.75.75 0 0 1 1.06 0L8 6.94l4.72-4.72a.75.75 0 1 1 1.06 1.06L9.06 8l4.72 4.72a.75.75 0 1 1-1.06 1.06L8 9.06l-4.72 4.72a.75.75 0 0 1-1.06-1.06L6.94 8 2.22 3.28a.75.75 0 0 1 0-1.06Z" />
            </svg>
          </button>
          <ScoreBadge score={brief.resonance_score} size="md" />
        </div>

        {/* Badges row */}
        <div className="flex items-center gap-2 flex-wrap">
          <PlatformBadge platform={platform} size="sm" />

          <span
            className={cn(
              "inline-flex items-center rounded-md border px-1.5 py-0.5",
              "text-[11px] font-medium",
              STAGE_STYLE[stage]
            )}
          >
            {stageLabel(stage)}
          </span>

          {brief.is_trend_match && (
            <span className="inline-flex items-center gap-1 rounded-md border
                             border-orange-400/30 bg-orange-400/10 px-1.5 py-0.5
                             text-[10px] font-semibold uppercase tracking-wide text-orange-400">
              🔥 Trending
            </span>
          )}
          {brief.is_time_machine && (
            <span className="inline-flex items-center gap-1 rounded-md border
                             border-violet-400/30 bg-violet-400/10 px-1.5 py-0.5
                             text-[10px] font-semibold uppercase tracking-wide text-violet-400">
              🔮 Then &amp; Now
            </span>
          )}

          {/* Source timestamp — right side */}
          {brief.source_timestamp_start !== null && (
            <span className="ml-auto text-[11px] tabular-nums text-zinc-400">
              {formatTimestamp(brief.source_timestamp_start)}
              {brief.source_timestamp_end !== null && (
                <> → {formatTimestamp(brief.source_timestamp_end)}</>
              )}
            </span>
          )}
        </div>
      </div>

      {/* ── Scrollable content ─────────────────────────────────────────────── */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ scrollbarWidth: "thin" }}
      >
        {/* Brief text */}
        <div className="px-5 py-5 flex flex-col gap-4">
          {/* Hook — emerald left-border accent */}
          <div className="border-l-2 border-emerald-500/60 pl-4">
            <p className="text-[22px] font-semibold leading-snug text-white">
              {brief.hook}
            </p>
          </div>

          {/* Body */}
          <p className="text-[17px] text-zinc-100 leading-[1.75] whitespace-pre-wrap">
            {brief.body}
          </p>

          {/* CTA */}
          {brief.cta && (
            <p className="border-t border-zinc-800/60 pt-3 text-[15px]
                          italic text-emerald-300">
              {brief.cta}
            </p>
          )}
        </div>

        <Divider label="Source Moment" />

        {/* Video player */}
        <div className="px-5 pb-5">
          <VideoPlayer
            src={youtubeUrl}
            seekToSeconds={brief.source_timestamp_start}
          />
        </div>

        <Divider label="Resonance Breakdown" />

        {/* Score breakdown */}
        {brief.score_breakdown ? (
          <div className="px-5 pb-5">
            <ScoreBreakdownPanel
              breakdown={brief.score_breakdown}
              totalScore={brief.resonance_score}
            />
          </div>
        ) : (
          <p className="px-5 pb-5 text-xs text-zinc-400">No score data.</p>
        )}

        {/* Carousel preview — only for instagram_carousel */}
        {isCarousel && carouselPayload && (
          <>
            <Divider label="Carousel Slides" />
            <div className="px-5 pb-5">
              <CarouselPreview payload={carouselPayload} />
            </div>
          </>
        )}

        {/* Bottom breathing room */}
        <div className="h-6" />
      </div>

      {/* ── Publish bar (sticky footer) ──────────────────────────────────── */}
      <PublishBar brief={brief} youtubeUrl={youtubeUrl} />
    </>
  );
}

// ── Section divider ───────────────────────────────────────────────────────────

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3 border-t border-zinc-800/50">
      <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-400 whitespace-nowrap">
        {label}
      </span>
      <div className="flex-1 h-px bg-zinc-800/60" />
    </div>
  );
}
