"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import KanbanColumn  from "./kanban-column";
import BriefDrawer   from "@/components/brief/brief-drawer";
import type { Brief, Platform, JourneyStage } from "@/lib/types";

// ── Column ordering ───────────────────────────────────────────────────────────

const PLATFORM_ORDER: Platform[] = [
  "linkedin",
  "x",
  "instagram_carousel",
  "short_form_video",
];

const STAGE_ORDER: JourneyStage[] = [
  "curious_explorer",
  "first_builder",
  "growth_navigator",
  "ecosystem_leader",
];

// ── Filter chip config ────────────────────────────────────────────────────────

const PLATFORM_CHIPS: { value: Platform | "all"; label: string }[] = [
  { value: "all",                label: "All Platforms"   },
  { value: "linkedin",           label: "LinkedIn"        },
  { value: "x",                  label: "X"               },
  { value: "instagram_carousel", label: "IG Carousel"     },
  { value: "short_form_video",   label: "Video"           },
];

const STAGE_CHIPS: { value: JourneyStage | "all"; label: string }[] = [
  { value: "all",                label: "All Stages"       },
  { value: "curious_explorer",   label: "Curious Explorer" },
  { value: "first_builder",      label: "First Builder"    },
  { value: "growth_navigator",   label: "Growth Navigator" },
  { value: "ecosystem_leader",   label: "Ecosystem Leader" },
];

// ── Props ─────────────────────────────────────────────────────────────────────

interface KanbanBoardProps {
  briefs:      Brief[];
  youtubeUrl:  string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function KanbanBoard({ briefs, youtubeUrl }: KanbanBoardProps) {
  const [groupBy, setGroupBy]         = useState<"platform" | "stage">("platform");
  const [activeFilter, setFilter]     = useState<string>("all");
  const [selectedBrief, setSelected]  = useState<Brief | null>(null);
  const [drawerOpen, setDrawerOpen]   = useState(false);

  function openBrief(brief: Brief) {
    setSelected(brief);
    setDrawerOpen(true);
  }

  // Reset filter when groupBy changes
  function handleGroupChange(next: "platform" | "stage") {
    setGroupBy(next);
    setFilter("all");
  }

  // Which columns to render
  const columns = groupBy === "platform" ? PLATFORM_ORDER : STAGE_ORDER;

  // Which filter chips to show (opposite dimension)
  const filterChips = groupBy === "platform" ? STAGE_CHIPS : PLATFORM_CHIPS;

  // Briefs for each column (after applying secondary filter)
  const columnBriefs = useMemo(() => {
    return Object.fromEntries(
      columns.map((colKey) => {
        let filtered = briefs.filter((b) =>
          groupBy === "platform"
            ? b.platform === colKey
            : b.journey_stage === colKey
        );

        // Apply secondary filter
        if (activeFilter !== "all") {
          filtered = filtered.filter((b) =>
            groupBy === "platform"
              ? b.journey_stage === activeFilter
              : b.platform === activeFilter
          );
        }

        // Sort: time machine + trend first, then by score desc
        filtered = filtered.slice().sort((a, b) => {
          if (a.is_time_machine && !b.is_time_machine) return -1;
          if (!a.is_time_machine && b.is_time_machine) return 1;
          if (a.is_trend_match && !b.is_trend_match) return -1;
          if (!a.is_trend_match && b.is_trend_match) return 1;
          return (b.resonance_score ?? 0) - (a.resonance_score ?? 0);
        });

        return [colKey, filtered];
      })
    );
  }, [briefs, groupBy, activeFilter, columns]);

  const visibleCount = Object.values(columnBriefs).reduce((s, arr) => s + arr.length, 0);

  return (
    <>
    <BriefDrawer
      brief={selectedBrief}
      open={drawerOpen}
      onClose={() => setDrawerOpen(false)}
      youtubeUrl={youtubeUrl}
    />
    <div className="flex flex-col gap-4">

      {/* ── Controls bar ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-6 py-3">

        {/* Group toggle */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-500 uppercase tracking-wide font-medium">
            Group by
          </span>
          <div className="flex rounded-lg border border-zinc-800 bg-zinc-900/60 p-0.5">
            {(["platform", "stage"] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => handleGroupChange(opt)}
                className={cn(
                  "rounded-md px-3 py-1 text-[12px] font-medium transition-all duration-150",
                  groupBy === opt
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                    : "text-zinc-400 hover:text-zinc-200 border border-transparent"
                )}
              >
                {opt === "platform" ? "Platform" : "Stage"}
              </button>
            ))}
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {filterChips.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={cn(
                "rounded-full px-2.5 py-1 text-[11px] font-medium transition-all duration-150",
                activeFilter === value
                  ? "bg-zinc-700 text-zinc-100 border border-zinc-600"
                  : "bg-transparent text-zinc-500 border border-zinc-800 hover:border-zinc-700 hover:text-zinc-300"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Visible count hint */}
        <span className="ml-auto text-[11px] text-zinc-600 tabular-nums">
          {visibleCount} brief{visibleCount !== 1 ? "s" : ""}
          {activeFilter !== "all" && " (filtered)"}
        </span>
      </div>

      {/* ── Kanban columns ────────────────────────────────────────────────── */}
      <div
        className="flex gap-4 overflow-x-auto pb-6"
        style={{ scrollbarWidth: "thin" }}
      >
        {columns.map((colKey) => (
          <KanbanColumn
            key={colKey}
            columnKey={colKey}
            groupBy={groupBy}
            briefs={columnBriefs[colKey] ?? []}
            onBriefClick={openBrief}
          />
        ))}
      </div>
    </div>
    </>
  );
}
