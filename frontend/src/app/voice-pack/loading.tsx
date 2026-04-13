// Loading skeleton for Voice Pack (/voice-pack)
// Mirrors: page header + two cards (Structural + Semantic).

export default function VoicePackLoading() {
  return (
    <main className="flex-1 max-w-screen-xl mx-auto w-full px-8 py-10">

      {/* ── Back link skeleton ─────────────────────────────────────────────── */}
      <div className="skeleton h-3.5 w-24 rounded-full mb-8" />

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="mb-10 flex flex-col gap-3">
        <div className="skeleton h-3 w-20 rounded-full" />
        <div className="skeleton h-10 w-72 rounded-lg" />
        <div className="skeleton h-4 w-96 rounded" />
        <div className="skeleton h-4 w-80 rounded" />
      </div>

      {/* ── Two cards side-by-side ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-6">
        <VoiceCardSkeleton rows={8} />
        <VoiceCardSkeleton rows={6} />
      </div>
    </main>
  );
}

function VoiceCardSkeleton({ rows }: { rows: number }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
      {/* Card header */}
      <div className="px-6 py-4 border-b border-zinc-800/60 flex items-center gap-3">
        <div className="skeleton h-8 w-8 rounded-lg" />
        <div className="flex flex-col gap-1.5">
          <div className="skeleton h-4 w-32 rounded" />
          <div className="skeleton h-3 w-48 rounded-full" />
        </div>
      </div>

      {/* Card body — stat rows */}
      <div className="px-6 py-5 flex flex-col gap-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <div className="skeleton h-3 rounded-full" style={{ width: `${40 + (i % 3) * 15}%` }} />
            <div className="skeleton h-5 rounded-lg" style={{ width: `${25 + (i % 4) * 10}%` }} />
          </div>
        ))}
      </div>

      {/* Tag chips area */}
      <div className="px-6 pb-6 flex flex-wrap gap-1.5">
        {[56, 72, 48, 88, 64, 52].map((w, i) => (
          <div key={i} className="skeleton h-6 rounded-md" style={{ width: w }} />
        ))}
      </div>
    </div>
  );
}
