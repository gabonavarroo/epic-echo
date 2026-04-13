// Editorial Board — /talks/[id]
// Server component: fetches talk + briefs from Supabase.
// KanbanBoard is a client component that owns groupBy/filter state.

import { notFound } from "next/navigation";
import Link         from "next/link";
import { supabase }  from "@/lib/supabase";
import ResonanceMeter from "@/components/editorial/resonance-meter";
import KanbanBoard    from "@/components/editorial/kanban-board";
import type { Talk, Brief, Insight } from "@/lib/types";

export const revalidate = 60;

// ── Types ─────────────────────────────────────────────────────────────────────

type InsightRow = Pick<Insight, "id" | "claim" | "speaker_quote" | "timestamp_start" | "timestamp_end">;

// ── Data fetching ─────────────────────────────────────────────────────────────

async function getTalkWithBriefs(id: string) {
  // 1. Fetch talk
  const { data: talk } = await supabase
    .from("talks")
    .select("*")
    .eq("id", id)
    .single() as { data: Talk | null };

  if (!talk) return null;

  // 2. Fetch insights for this talk (ids + metadata for drawer later)
  const { data: insightsRaw } = await supabase
    .from("insights")
    .select("id, claim, speaker_quote, timestamp_start, timestamp_end")
    .eq("talk_id", talk.id) as { data: InsightRow[] | null };

  const insights = insightsRaw ?? [];
  const insightIds = insights.map((i) => i.id);

  if (!insightIds.length) {
    return { talk, briefs: [], insightMap: {} };
  }

  // 3. Fetch ALL briefs for this talk (in batches of 500 to be safe)
  const { data: briefs } = await supabase
    .from("briefs")
    .select("*")
    .in("insight_id", insightIds)
    .order("resonance_score", { ascending: false }) as { data: Brief[] | null };

  // Build insight lookup map (for drawer — passed through but not used in kanban cards)
  const insightMap = Object.fromEntries(insights.map((i) => [i.id, i]));

  return { talk, briefs: briefs ?? [], insightMap };
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function EditorialBoardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getTalkWithBriefs(id);

  if (!result) notFound();

  const { talk, briefs } = result;

  return (
    <main className="flex flex-col flex-1 min-h-0">

      {/* ── Resonance Meter ─────────────────────────────────────────────── */}
      <ResonanceMeter
        briefs={briefs}
        talkTitle={talk.title}
        speakerName={talk.speaker_name}
      />

      {/* ── Board area ──────────────────────────────────────────────────── */}
      <div className="flex-1 max-w-screen-2xl mx-auto w-full px-8 py-6">

        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500
                     hover:text-zinc-300 transition-colors mb-5 group"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="h-3 w-3 transition-transform group-hover:-translate-x-0.5"
          >
            <path
              fillRule="evenodd"
              d="M14 8a.75.75 0 0 1-.75.75H3.56l2.22 2.22a.75.75 0 1 1-1.06 1.06l-3.5-3.5a.75.75 0 0 1 0-1.06l3.5-3.5a.75.75 0 0 1 1.06 1.06L3.56 7.25h9.69A.75.75 0 0 1 14 8Z"
              clipRule="evenodd"
            />
          </svg>
          Back to Talks
        </Link>

        {/* Kanban — client component, receives all data as props */}
        {briefs.length === 0 ? (
          <EmptyBriefs talkTitle={talk.title} />
        ) : (
          <KanbanBoard briefs={briefs} youtubeUrl={talk.youtube_url} />
        )}
      </div>
    </main>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyBriefs({ talkTitle }: { talkTitle: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-32
                    rounded-2xl border border-dashed border-zinc-800 text-center">
      <span className="text-3xl">📭</span>
      <p className="text-sm font-medium text-zinc-400">No briefs for &ldquo;{talkTitle}&rdquo;</p>
      <p className="text-xs text-zinc-600">
        Run{" "}
        <code className="font-mono text-zinc-500">
          python scripts/run_pipeline.py --forge
        </code>{" "}
        to generate briefs.
      </p>
    </div>
  );
}
