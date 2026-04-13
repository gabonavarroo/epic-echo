// Landing page — server component.
// Fetches talks + per-talk insight/brief counts from Supabase, then renders
// the Hero section and the 3 TalkCards.

import { supabase }  from "@/lib/supabase";
import Hero          from "@/components/landing/hero";
import TalkCard      from "@/components/landing/talk-card";
import type { Talk } from "@/lib/types";

export const revalidate = 60; // ISR — revalidate every 60s

// ── Data helpers ─────────────────────────────────────────────────────────────

async function getTalksWithStats() {
  // 1. Fetch all talks
  const { data: talks, error: talksError } = await supabase
    .from("talks")
    .select("*")
    .order("created_at", { ascending: true }) as { data: Talk[] | null; error: unknown };

  if (talksError || !talks) return { talks: [], statsMap: {}, totals: { insights: 0, briefs: 0 } };

  // 2. Fetch all insights (just id + talk_id — no heavy payload)
  const { data: insights } = await supabase
    .from("insights")
    .select("id, talk_id") as { data: { id: string; talk_id: string }[] | null };

  const allInsights = insights ?? [];

  // Build a map: talk_id → insight ids[]
  const insightIdsByTalk: Record<string, string[]> = {};
  for (const ins of allInsights) {
    insightIdsByTalk[ins.talk_id] ??= [];
    insightIdsByTalk[ins.talk_id].push(ins.id);
  }

  // 3. Fetch brief counts per talk via insight_id IN (...)
  const briefCountByTalk: Record<string, number> = {};

  await Promise.all(
    talks.map(async (talk) => {
      const ids = insightIdsByTalk[talk.id] ?? [];
      if (!ids.length) {
        briefCountByTalk[talk.id] = 0;
        return;
      }
      const { count } = await supabase
        .from("briefs")
        .select("*", { count: "exact", head: true })
        .in("insight_id", ids);
      briefCountByTalk[talk.id] = count ?? 0;
    })
  );

  // 4. Build final stats map
  const statsMap: Record<string, { insightCount: number; briefCount: number }> = {};
  let totalInsights = 0;
  let totalBriefs   = 0;

  for (const talk of talks) {
    const ic = insightIdsByTalk[talk.id]?.length ?? 0;
    const bc = briefCountByTalk[talk.id] ?? 0;
    statsMap[talk.id] = { insightCount: ic, briefCount: bc };
    totalInsights += ic;
    totalBriefs   += bc;
  }

  return {
    talks: talks as Talk[],
    statsMap,
    totals: { insights: totalInsights, briefs: totalBriefs },
  };
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function LandingPage() {
  const { talks, statsMap, totals } = await getTalksWithStats();

  return (
    <main className="flex flex-col flex-1">

      {/* Hero */}
      <Hero
        insightTotal={totals.insights}
        briefTotal={totals.briefs}
        talkCount={talks.length}
      />

      {/* ── Section header ─────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto w-full px-8 pb-24">
        <div className="flex items-center gap-4 mb-8">
          <h2
            className="text-xs font-semibold tracking-[0.18em] uppercase text-zinc-500 opacity-0"
            style={{ animation: "fade-in-up 0.5s ease forwards 0.75s" }}
          >
            Founder Talks
          </h2>
          <div
            className="flex-1 h-px bg-zinc-800 opacity-0"
            style={{ animation: "fade-in-up 0.5s ease forwards 0.8s" }}
          />
          <span
            className="text-xs text-zinc-600 opacity-0"
            style={{ animation: "fade-in-up 0.5s ease forwards 0.85s" }}
          >
            {talks.length} processed
          </span>
        </div>

        {/* ── Cards grid ─────────────────────────────────────────────────── */}
        {talks.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-3 gap-6">
            {talks.map((talk, i) => (
              <TalkCard
                key={talk.id}
                talk={talk}
                insightCount={statsMap[talk.id]?.insightCount ?? 0}
                briefCount={statsMap[talk.id]?.briefCount ?? 0}
                index={i}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Footer strip ───────────────────────────────────────────────────── */}
      <footer className="mt-auto border-t border-zinc-800/50 py-6">
        <div className="max-w-7xl mx-auto px-8 flex items-center justify-between">
          <span className="text-xs text-zinc-600">
            EPIC Echo · MAD Fellowship 2026
          </span>
          <span className="text-xs text-zinc-700 italic">
            &ldquo;EchoStudio — content intelligence for any institution sitting on dormant expertise.&rdquo;
          </span>
        </div>
      </footer>
    </main>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24
                    rounded-2xl border border-dashed border-zinc-800 text-center">
      <span className="text-2xl">📭</span>
      <p className="text-sm text-zinc-500">No talks found in the database.</p>
      <p className="text-xs text-zinc-700">
        Run <code className="font-mono text-zinc-500">python scripts/run_pipeline.py --talk 1</code> to ingest a talk.
      </p>
    </div>
  );
}
