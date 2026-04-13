// Loading skeleton for the Landing page (/)
// Mirrors the real layout: hero section + 3 talk card placeholders.

export default function LandingLoading() {
  return (
    <main className="flex flex-col flex-1">

      {/* ── Hero skeleton ─────────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center
                          min-h-[420px] px-8 py-20 overflow-hidden">
        {/* Faint ring backdrop */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
          {[220, 340, 460, 580].map((size) => (
            <span
              key={size}
              className="absolute rounded-full border border-zinc-600"
              style={{ width: size, height: size }}
            />
          ))}
        </div>

        <div className="relative flex flex-col items-center gap-5 z-10 w-full max-w-lg">
          {/* Label */}
          <div className="skeleton h-3 w-28 rounded-full" />
          {/* Headline line 1 */}
          <div className="skeleton h-10 w-72 rounded-lg" />
          {/* Headline line 2 */}
          <div className="skeleton h-10 w-52 rounded-lg" />
          {/* Subline */}
          <div className="skeleton h-4 w-64 rounded-full mt-2" />
          {/* Stat pills */}
          <div className="flex gap-3 mt-2">
            <div className="skeleton h-8 w-28 rounded-xl" />
            <div className="skeleton h-8 w-28 rounded-xl" />
            <div className="skeleton h-8 w-28 rounded-xl" />
          </div>
        </div>
      </section>

      {/* ── Cards section ─────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto w-full px-8 pb-24">
        {/* Section header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="skeleton h-3 w-24 rounded-full" />
          <div className="flex-1 h-px bg-zinc-800" />
          <div className="skeleton h-3 w-16 rounded-full" />
        </div>

        {/* 3 card skeletons */}
        <div className="grid grid-cols-3 gap-6">
          {[0, 1, 2].map((i) => (
            <TalkCardSkeleton key={i} />
          ))}
        </div>
      </section>
    </main>
  );
}

function TalkCardSkeleton() {
  return (
    <div className="flex flex-col rounded-2xl border border-zinc-800/70
                    bg-zinc-900/60 overflow-hidden">
      {/* Thumbnail */}
      <div className="skeleton w-full aspect-video rounded-none" style={{ borderRadius: 0 }} />

      {/* Body */}
      <div className="flex flex-col gap-4 p-5">
        {/* Title lines */}
        <div className="flex flex-col gap-2">
          <div className="skeleton h-4 w-full rounded" />
          <div className="skeleton h-4 w-3/4 rounded" />
          <div className="skeleton h-3 w-1/3 rounded-full mt-0.5" />
        </div>

        {/* Stat pills */}
        <div className="flex gap-2">
          <div className="skeleton h-7 w-24 rounded-lg" />
          <div className="skeleton h-7 w-24 rounded-lg" />
        </div>

        {/* Platform dots row */}
        <div className="flex gap-1.5 items-center">
          {[0, 1, 2, 3].map((j) => (
            <div key={j} className="skeleton h-2 w-2 rounded-full" />
          ))}
          <div className="skeleton h-3 w-16 rounded-full ml-1" />
        </div>

        {/* CTA button */}
        <div className="skeleton h-10 w-full rounded-xl mt-1" />
      </div>
    </div>
  );
}
