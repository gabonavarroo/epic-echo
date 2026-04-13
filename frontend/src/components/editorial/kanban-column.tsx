import { cn } from "@/lib/utils";
import BriefCard from "./brief-card";
import { ScoreBadge } from "@/components/shared/score-badge";
import type { Brief } from "@/lib/types";

// ── Column header config ──────────────────────────────────────────────────────

type ColumnKey = string;

interface ColumnMeta {
  label:       string;
  accentClass: string;   // text color for the header label
  dotClass:    string;   // bg color for the accent dot
}

const PLATFORM_META: Record<string, ColumnMeta> = {
  linkedin:            { label: "LinkedIn",    accentClass: "text-sky-400",     dotClass: "bg-sky-400"     },
  x:                   { label: "X",           accentClass: "text-zinc-200",    dotClass: "bg-zinc-300"    },
  instagram_carousel:  { label: "IG Carousel", accentClass: "text-pink-400",    dotClass: "bg-pink-400"    },
  short_form_video:    { label: "Video",        accentClass: "text-orange-400",  dotClass: "bg-orange-400"  },
};

const STAGE_META: Record<string, ColumnMeta> = {
  curious_explorer:  { label: "Curious Explorer",  accentClass: "text-violet-400",  dotClass: "bg-violet-400"  },
  first_builder:     { label: "First Builder",      accentClass: "text-blue-400",    dotClass: "bg-blue-400"    },
  growth_navigator:  { label: "Growth Navigator",   accentClass: "text-emerald-400", dotClass: "bg-emerald-400" },
  ecosystem_leader:  { label: "Ecosystem Leader",   accentClass: "text-amber-400",   dotClass: "bg-amber-400"   },
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface KanbanColumnProps {
  columnKey: ColumnKey;
  groupBy:   "platform" | "stage";
  briefs:    Brief[];
  onBriefClick?: (brief: Brief) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function KanbanColumn({
  columnKey,
  groupBy,
  briefs,
  onBriefClick,
}: KanbanColumnProps) {
  const meta =
    groupBy === "platform"
      ? PLATFORM_META[columnKey]
      : STAGE_META[columnKey];

  if (!meta) return null;

  // Average score for the column header
  const scored   = briefs.filter((b) => b.resonance_score !== null);
  const colAvg   = scored.length
    ? Math.round(scored.reduce((s, b) => s + (b.resonance_score ?? 0), 0) / scored.length)
    : null;

  const trendCount   = briefs.filter((b) => b.is_trend_match).length;
  const machineCount = briefs.filter((b) => b.is_time_machine).length;

  return (
    <div className="flex flex-none flex-col w-[340px]">

      {/* ── Column header ─────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 mb-3 flex items-center justify-between
                      rounded-xl border border-zinc-800/60 bg-zinc-950/90
                      px-3.5 py-2.5 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          {/* Accent dot */}
          <span className={cn("h-2 w-2 rounded-full", meta.dotClass)} style={{ opacity: 0.75 }} />
          {/* Label */}
          <span className={cn("text-[13px] font-semibold", meta.accentClass)}>
            {meta.label}
          </span>
          {/* Count chip */}
          <span className="rounded-full bg-zinc-800 px-1.5 py-0.5 text-[11px]
                           font-medium text-zinc-400 tabular-nums">
            {briefs.length}
          </span>
          {/* Special indicators */}
          {trendCount > 0 && (
            <span className="text-[10px] text-orange-400" title={`${trendCount} trending`}>
              🔥{trendCount}
            </span>
          )}
          {machineCount > 0 && (
            <span className="text-[10px] text-violet-400" title={`${machineCount} time machine`}>
              🔮{machineCount}
            </span>
          )}
        </div>
        {/* Column avg score */}
        {colAvg !== null && (
          <ScoreBadge score={colAvg} size="sm" />
        )}
      </div>

      {/* ── Cards container ───────────────────────────────────────────────── */}
      <div
        className="flex flex-col gap-2.5 overflow-y-auto pr-0.5"
        style={{ maxHeight: "calc(100vh - 280px)" }}
      >
        {briefs.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl
                          border border-dashed border-zinc-800 py-10 text-center">
            <p className="text-xs text-zinc-600">No briefs</p>
          </div>
        ) : (
          briefs.map((brief) => (
            <BriefCard
              key={brief.id}
              brief={brief}
              groupBy={groupBy}
              onClick={onBriefClick}
            />
          ))
        )}
      </div>
    </div>
  );
}
