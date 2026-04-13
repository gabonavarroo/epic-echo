// About — /about
// Static page: thesis, architecture overview, tech stack, roadmap.

import Link from "next/link";
import { cn } from "@/lib/utils";

// ── Component ─────────────────────────────────────────────────────────────────

export default function AboutPage() {
  return (
    <main className="flex-1 max-w-screen-lg mx-auto w-full px-8 py-10">

      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs text-zinc-500
                   hover:text-zinc-300 transition-colors mb-8 group"
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

      {/* ── Thesis ─────────────────────────────────────────────────────── */}
      <section className="mb-14">
        <p className="text-[11px] uppercase tracking-widest text-emerald-500 font-semibold mb-3">
          The Thesis
        </p>
        <h1 className="text-5xl font-extrabold tracking-tight text-white mb-6 leading-tight">
          Dormant wisdom,{" "}
          <span className="bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
            reborn.
          </span>
        </h1>
        <div className="max-w-2xl space-y-4 text-[15px] text-zinc-300 leading-relaxed">
          <p>
            EPIC Lab has hundreds of hours of founder wisdom locked in YouTube videos
            with triple-digit view counts. The problem isn&apos;t the content — the speakers
            are real founders who built Plenna, Penta, Palenca, suvi. The problem is{" "}
            <span className="text-white font-medium">distribution bandwidth</span>.
          </p>
          <p>
            A 7-person team cannot watch 45-minute talks, extract the 3 moments that would
            stop a scroll on LinkedIn, rewrite them for Instagram carousels, and repeat this
            for 50+ recordings.
          </p>
          <p>
            EPIC Echo is a{" "}
            <span className="text-emerald-400 font-medium">content intelligence layer</span>{" "}
            — not a content generator. It processes source talks into editor-ready briefs across
            4 platforms, scored transparently on a 6-axis rubric, with one-click publishing handoff.
            The human editor goes from 14 hours of work to 15 minutes. We output briefs and
            structured packs; we never output finished media. The human stays in the loop.
          </p>
        </div>
      </section>

      {/* ── Architecture ───────────────────────────────────────────────── */}
      <section className="mb-14">
        <SectionLabel>Architecture</SectionLabel>

        {/* Diagram — ASCII rendered as code */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden mb-6">
          <div className="px-5 py-3 border-b border-zinc-800/60 flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="h-3 w-3 rounded-full bg-zinc-700" />
              <span className="h-3 w-3 rounded-full bg-zinc-700" />
              <span className="h-3 w-3 rounded-full bg-zinc-700" />
            </div>
            <span className="text-[11px] text-zinc-500 font-mono ml-2">architecture.txt</span>
          </div>
          <pre className="px-6 py-5 text-[12px] font-mono text-zinc-400 leading-relaxed overflow-x-auto whitespace-pre">
{`┌─────────────────────────────────────────────────────────────┐
│                     Vercel (Frontend)                        │
│   Next.js 15 App Router · TypeScript · Tailwind · shadcn/ui │
│                                                              │
│   /              → Landing (3 talk cards)                    │
│   /talks/[id]    → Editorial Board (kanban + Resonance Meter)│
│   /voice-pack    → Voice Pack showcase                       │
│   /about         → Architecture + thesis + roadmap           │
│                                                              │
│   Brief Drawer   → Sheet overlay                             │
│                     Video player + score + publish buttons    │
│                                                              │
│   Data: reads directly from Supabase (anon key, RLS off)    │
└──────────────────────────┬──────────────────────────────────┘
                           │ reads
                           ▼
┌─────────────────────────────────────────────────────────────┐
│               Supabase (Postgres + pgvector)                 │
│                                                              │
│   talks │ insights │ briefs │ voice_pack                     │
│   trend_matches │ source_posts                               │
│                                                              │
│   pgvector: cosine similarity on insights.embedding (1536d)  │
└──────────────────────────┬──────────────────────────────────┘
                           ▲ writes (service role key)
                           │
┌─────────────────────────────────────────────────────────────┐
│            Local Python Pipeline (dev only)                  │
│                                                              │
│   run_pipeline.py orchestrates:                              │
│     ingest_talk()   → yt-dlp → Whisper → extract → embed    │
│     forge_briefs()  → generate × score × save               │
│     extract_voice() → structural + semantic analysis         │
│     check_trends()  → embed → vector match → bridge post     │
│                                                              │
│   Azure OpenAI: whisper, gpt-4o, text-embedding-3-small     │
│   All calls via Pydantic structured outputs (json_schema)   │
└─────────────────────────────────────────────────────────────┘`}
          </pre>
        </div>

        <p className="text-[13px] text-zinc-500 leading-relaxed max-w-2xl">
          Key principle: the frontend reads from Supabase directly. The Python pipeline only runs
          locally during development. The demo runs entirely off pre-cached Supabase data — no backend
          cold starts, no CORS, no deploy config.
        </p>
      </section>

      {/* ── Tech stack ──────────────────────────────────────────────────── */}
      <section className="mb-14">
        <SectionLabel>Tech Stack</SectionLabel>

        <div className="grid grid-cols-2 gap-4">
          {STACK.map(({ layer, items, color }) => (
            <div
              key={layer}
              className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-5 py-4"
            >
              <p className={cn("text-[11px] uppercase tracking-widest font-semibold mb-3", color)}>
                {layer}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {items.map((item) => (
                  <span
                    key={item}
                    className="rounded-md border border-zinc-700/60 bg-zinc-800/50
                               px-2.5 py-1 text-[12px] text-zinc-300 font-mono"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pipeline stages ──────────────────────────────────────────────── */}
      <section className="mb-14">
        <SectionLabel>Pipeline Stages</SectionLabel>

        <div className="relative">
          {/* Vertical connector */}
          <div className="absolute left-[19px] top-6 bottom-6 w-px bg-gradient-to-b
                           from-emerald-500/30 via-zinc-700/50 to-transparent" />

          <div className="flex flex-col gap-0">
            {PIPELINE.map(({ step, title, desc, badge }, i) => (
              <div key={i} className="flex gap-4 py-3">
                <div className="flex-none flex flex-col items-center">
                  <div className="h-9 w-9 rounded-full border border-zinc-700 bg-zinc-900
                                   flex items-center justify-center text-[11px] font-bold
                                   text-zinc-400 tabular-nums z-10">
                    {step}
                  </div>
                </div>
                <div className="pb-2">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-[13px] font-semibold text-zinc-200">{title}</p>
                    {badge && (
                      <span className="rounded-md border border-emerald-500/25 bg-emerald-500/8
                                       px-1.5 py-0.5 text-[10px] text-emerald-400 font-medium">
                        {badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-zinc-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What's hardcoded ─────────────────────────────────────────────── */}
      <section className="mb-14">
        <SectionLabel>Honest: What&apos;s Hardcoded</SectionLabel>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-5 py-4 space-y-2">
          {HARDCODED.map((item, i) => (
            <div key={i} className="flex items-start gap-2.5 text-[12px] text-zinc-400">
              <span className="mt-0.5 text-amber-500">◆</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[12px] text-zinc-600">
          The pipeline logic, LLM calls, scoring rubric, and vector search are fully real and
          reproducible. The seed data is real EPIC Lab content.
        </p>
      </section>

      {/* ── Roadmap ──────────────────────────────────────────────────────── */}
      <section className="mb-10">
        <SectionLabel>Roadmap → EchoStudio</SectionLabel>
        <div className="grid grid-cols-3 gap-3">
          {ROADMAP.map(({ phase, title, items, active }) => (
            <div
              key={phase}
              className={cn(
                "rounded-xl border px-4 py-4",
                active
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : "border-zinc-800 bg-zinc-900/30"
              )}
            >
              <p className={cn(
                "text-[10px] uppercase tracking-widest font-semibold mb-2",
                active ? "text-emerald-400" : "text-zinc-600"
              )}>
                {phase}
              </p>
              <p className="text-[13px] font-semibold text-zinc-200 mb-2.5">{title}</p>
              <ul className="space-y-1.5">
                {items.map((item, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[12px] text-zinc-500">
                    <span className={active ? "text-emerald-500" : "text-zinc-700"}>—</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Footer quote */}
      <div className="mt-12 pt-8 border-t border-zinc-800/60 text-center">
        <p className="text-sm text-zinc-600 italic">
          &ldquo;The intelligence was always in the talks. We just built the layer to surface it.&rdquo;
        </p>
        <p className="mt-2 text-[11px] text-zinc-700">
          EPIC Echo · MAD Fellowship 2026
        </p>
      </div>
    </main>
  );
}

// ── Static data ───────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] uppercase tracking-widest text-emerald-500 font-semibold mb-4">
      {children}
    </p>
  );
}

const STACK = [
  {
    layer: "Frontend",
    color: "text-sky-400",
    items: ["Next.js 15", "TypeScript", "Tailwind CSS", "shadcn/ui", "Vercel"],
  },
  {
    layer: "Database",
    color: "text-emerald-400",
    items: ["Supabase", "Postgres", "pgvector", "ivfflat index"],
  },
  {
    layer: "AI / LLM",
    color: "text-violet-400",
    items: [
      "Azure OpenAI",
      "gpt-4o",
      "Whisper",
      "text-embedding-3-small",
      "Pydantic structured outputs",
    ],
  },
  {
    layer: "Pipeline",
    color: "text-amber-400",
    items: ["Python 3.11", "FastAPI", "yt-dlp", "asyncio", "Semaphore concurrency"],
  },
];

const PIPELINE = [
  {
    step: "1",
    title: "Ingest",
    badge: "yt-dlp + Whisper",
    desc: "YouTube audio downloaded and transcribed with Azure Whisper. Raw transcript saved with word-level timestamps.",
  },
  {
    step: "2",
    title: "Extract",
    badge: "gpt-4o",
    desc: "Speaker-turn chunks fed to GPT-4o with strict JSON schema output. Each insight: claim, evidence, speaker quote, timestamps, journey stages.",
  },
  {
    step: "3",
    title: "Embed",
    badge: "text-embedding-3-small",
    desc: "1536-dim embeddings stored in Supabase pgvector. Enables cosine similarity for Trend Hijacker matching.",
  },
  {
    step: "4",
    title: "Voice Pack",
    badge: "structural + semantic",
    desc: "63 real EPIC Lab posts analysed. Structural pass is pure Python (word counts, emoji density, openers). Semantic pass uses GPT-4o for tone and pattern extraction.",
  },
  {
    step: "5",
    title: "Forge + Score",
    badge: "748 briefs",
    desc: "Each insight × relevant journey stages × 4 platforms. Every brief scored on 6 axes (hook strength, evidence, voice, format fit, stage clarity, novelty). Avg 79/100.",
  },
  {
    step: "6",
    title: "Trend Hijacker",
    badge: "vector search",
    desc: "2 trending headlines embedded and matched to insights via cosine similarity (threshold 0.50). Bridge posts generated in EPIC Lab's voice.",
  },
  {
    step: "7",
    title: "Time Machine",
    badge: "1 card",
    desc: "A hand-curated 'Then & Now' card connecting a 2023 Adolfo Babatz prediction about Mexico's payment desert to the Clip unicorn outcome.",
  },
];

const HARDCODED = [
  "3 demo talks — selected because they represent distinct topic domains (leadership, fintech, marketing).",
  "2 trend headlines in seeds/trend_headlines.json — chosen to connect to the processed talks.",
  "1 Time Machine card — the Clip unicornio case (Babatz/payments → CLIP Series D).",
  "Similarity threshold at 0.50 (not the spec's 0.70) — founder talks and news articles live in different embedding neighborhoods.",
];

const ROADMAP = [
  {
    phase: "Now — EPIC Echo",
    title: "Demo",
    active: true,
    items: [
      "3 talks, 748 briefs",
      "4 platforms × 4 stages",
      "Trend hijacker",
      "Voice Pack",
      "1-click publish handoff",
    ],
  },
  {
    phase: "Next — EchoStudio",
    title: "Product",
    active: false,
    items: [
      "Any YouTube URL",
      "Editor approval flow",
      "Scheduled publishing",
      "Analytics dashboard",
      "Multi-language output",
    ],
  },
  {
    phase: "Future — EchoOS",
    title: "Platform",
    active: false,
    items: [
      "Any institution",
      "Custom voice packs",
      "White-label",
      "API access",
      "Multi-tenant",
    ],
  },
];
