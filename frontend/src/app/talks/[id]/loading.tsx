// Loading skeleton for the Editorial Board (/talks/[id])
// Mirrors: Resonance Meter bar + Kanban columns.

export default function EditorialBoardLoading() {
  return (
    <div className="flex flex-col flex-1 min-h-0">

      {/* ── Resonance Meter skeleton ───────────────────────────────────────── */}
      <div className="border-b border-zinc-800/60 bg-zinc-900/40">
        <div className="max-w-screen-2xl mx-auto px-8 py-4">
          {/* Talk title row */}
          <div className="flex items-center gap-3 mb-4">
            <div className="skeleton h-5 w-64 rounded" />
            <div className="skeleton h-4 w-32 rounded-full" />
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-6 flex-wrap">
            {[80, 56, 64, 88, 56, 72].map((w, i) => (
              <div key={i} className="flex flex-col gap-1">
                <div className="skeleton h-6 rounded" style={{ width: w }} />
                <div className="skeleton h-2.5 rounded-full" style={{ width: w * 0.7 }} />
              </div>
            ))}
            {/* Score distribution bar */}
            <div className="ml-auto skeleton h-5 w-48 rounded-full" />
          </div>
        </div>
      </div>

      {/* ── Toolbar skeleton ───────────────────────────────────────────────── */}
      <div className="border-b border-zinc-800/40 bg-zinc-950/30">
        <div className="max-w-screen-2xl mx-auto px-8 py-3 flex items-center gap-3">
          <div className="skeleton h-8 w-32 rounded-lg" />
          <div className="skeleton h-8 w-px rounded" style={{ width: 1, opacity: 0.3 }} />
          {[72, 88, 64, 80].map((w, i) => (
            <div key={i} className="skeleton h-7 rounded-lg" style={{ width: w }} />
          ))}
          <div className="ml-auto skeleton h-8 w-36 rounded-lg" />
        </div>
      </div>

      {/* ── Kanban columns skeleton ────────────────────────────────────────── */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-4 px-8 py-6 min-w-max">
          {[4, 3, 5, 3].map((cardCount, col) => (
            <KanbanColumnSkeleton key={col} cardCount={cardCount} />
          ))}
        </div>
      </div>
    </div>
  );
}

function KanbanColumnSkeleton({ cardCount }: { cardCount: number }) {
  return (
    <div className="flex flex-col gap-3 w-72 flex-shrink-0">
      {/* Column header */}
      <div className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-sm pb-2">
        <div className="flex items-center justify-between">
          <div className="skeleton h-5 w-28 rounded" />
          <div className="skeleton h-5 w-10 rounded-full" />
        </div>
        <div className="skeleton h-3 w-20 rounded-full mt-1.5" />
      </div>

      {/* Cards */}
      {Array.from({ length: cardCount }).map((_, i) => (
        <BriefCardSkeleton key={i} />
      ))}
    </div>
  );
}

function BriefCardSkeleton() {
  return (
    <div className="rounded-xl border border-zinc-800/70 bg-zinc-900/50 p-3.5 flex flex-col gap-2.5">
      {/* Score badge row */}
      <div className="flex items-center justify-between">
        <div className="skeleton h-5 w-10 rounded-md" />
        <div className="skeleton h-4 w-20 rounded-full" />
      </div>

      {/* Hook text lines */}
      <div className="flex flex-col gap-1.5">
        <div className="skeleton h-3.5 w-full rounded" />
        <div className="skeleton h-3.5 w-5/6 rounded" />
        <div className="skeleton h-3.5 w-2/3 rounded" />
      </div>

      {/* Badge row */}
      <div className="flex gap-1.5 items-center mt-0.5">
        <div className="skeleton h-4 w-16 rounded-md" />
        <div className="skeleton h-4 w-20 rounded-md" />
      </div>

      {/* Timestamp */}
      <div className="skeleton h-3 w-24 rounded-full" />
    </div>
  );
}
