// Voice Pack — /voice-pack
// Server component: fetches the single voice_pack row from Supabase.

import Link          from "next/link";
import { supabase }  from "@/lib/supabase";
import StructuralCard from "@/components/voice-pack/structural-card";
import SemanticCard   from "@/components/voice-pack/semantic-card";
import type { VoicePack } from "@/lib/types";

export const revalidate = 3600; // voice pack changes rarely

// ── Data fetching ─────────────────────────────────────────────────────────────

async function getVoicePack(): Promise<VoicePack | null> {
  const { data } = await supabase
    .from("voice_pack")
    .select("*")
    .order("extracted_at", { ascending: false })
    .limit(1)
    .single() as { data: VoicePack | null };

  return data;
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function VoicePackPage() {
  const voicePack = await getVoicePack();

  return (
    <main className="flex-1 max-w-screen-xl mx-auto w-full px-8 py-10">

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="mb-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500
                     hover:text-zinc-300 transition-colors mb-6 group"
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

        {/* Title + descriptor */}
        <div className="flex items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Voice Pack
            </h1>
            <p className="mt-1.5 text-sm text-zinc-400 max-w-xl">
              EPIC Lab&apos;s distilled editorial identity — extracted from{" "}
              <span className="text-zinc-200 font-medium">
                {voicePack?.source_post_count ?? "—"} real posts
              </span>{" "}
              and used to calibrate every generated brief.
            </p>
          </div>

          {/* Extracted at pill */}
          {voicePack && (
            <div className="ml-auto flex-none mb-1">
              <span className="rounded-full border border-zinc-700/60 bg-zinc-800/50
                               px-3 py-1 text-[11px] text-zinc-400 tabular-nums">
                Extracted{" "}
                {new Date(voicePack.extracted_at).toLocaleDateString("es-MX", {
                  day:   "numeric",
                  month: "short",
                  year:  "numeric",
                })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      {!voicePack ? (
        <EmptyState />
      ) : (
        <>
          {/* Sample count banner */}
          <div className="mb-6 rounded-xl border border-zinc-800/60 bg-zinc-900/40 px-5 py-3
                           flex items-center gap-6">
            <Stat label="Source posts analysed" value={voicePack.source_post_count} />
            <div className="h-5 w-px bg-zinc-800" />
            <Stat label="Structural sample" value={voicePack.sample_count} />
            <div className="h-5 w-px bg-zinc-800" />
            <Stat
              label="Voice quality"
              value={voicePack.source_post_count >= 50 ? "High" : voicePack.source_post_count >= 20 ? "Medium" : "Low"}
              accent
            />
          </div>

          {/* Two-column card layout */}
          <div className="grid grid-cols-2 gap-6 items-start">
            <StructuralCard
              profile={voicePack.structural_profile}
              sampleCount={voicePack.source_post_count}
            />
            <SemanticCard profile={voicePack.semantic_profile} />
          </div>

          {/* Bottom note */}
          <p className="mt-8 text-center text-[11px] text-zinc-600">
            This profile is injected into every brief prompt via the{" "}
            <code className="font-mono text-zinc-500">voice_conformance</code> scoring axis —
            ensuring every generated brief sounds like EPIC Lab, not like GPT.
          </p>
        </>
      )}
    </main>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Stat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-2">
      <span className={`text-xl font-bold tabular-nums ${accent ? "text-emerald-400" : "text-white"}`}>
        {value}
      </span>
      <span className="text-[12px] text-zinc-500">{label}</span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-32
                    rounded-2xl border border-dashed border-zinc-800 text-center">
      <span className="text-3xl">🎙️</span>
      <p className="text-sm font-medium text-zinc-400">No voice pack found</p>
      <p className="text-xs text-zinc-600">
        Run{" "}
        <code className="font-mono text-zinc-500">
          python scripts/run_pipeline.py --voice
        </code>{" "}
        to extract the voice profile.
      </p>
    </div>
  );
}
