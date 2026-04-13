// Hero section — sonar echo rings + stats.
// 8 concentric rings, each at a different fixed diameter, all using the same
// echo-ring keyframe (scale 0.4 → 2.8, opacity 0.45 → 0). Staggered 0.7 s
// apart with slightly varying durations so they drift out of sync over time.

interface HeroStats {
  insightTotal: number;
  briefTotal:   number;
  talkCount:    number;
}

// 8 rings: 220 px base, stepping 110 px each.
// Duration increases per ring so outer rings pulse more slowly — feels natural.
const RINGS = [
  { sizePx: 220, durationS: 3.2 },
  { sizePx: 330, durationS: 4.1 },
  { sizePx: 440, durationS: 5.0 },
  { sizePx: 550, durationS: 5.9 },
  { sizePx: 660, durationS: 6.8 },
  { sizePx: 770, durationS: 7.7 },
  { sizePx: 880, durationS: 8.6 },
  { sizePx: 990, durationS: 9.5 },
];
const STAGGER_S = 0.7;

export default function Hero({ insightTotal, briefTotal, talkCount }: HeroStats) {
  return (
    <section className="relative flex flex-col items-center justify-center pt-28 pb-20 overflow-hidden">

      {/* ── Echo rings layer ─────────────────────────────────────────────── */}
      <div
        className="pointer-events-none select-none absolute inset-0 flex items-center justify-center"
        aria-hidden="true"
      >
        {RINGS.map(({ sizePx, durationS }, i) => (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              width:        sizePx,
              height:       sizePx,
              border:       "1px solid rgba(255, 255, 255, 0.14)",
              animation:    `echo-ring ${durationS}s ease-out infinite`,
              animationDelay: `${i * STAGGER_S}s`,
            }}
          />
        ))}
      </div>

      {/* ── Label pill ─────────────────────────────────────────────────────── */}
      <div
        className="relative z-10 mb-6 flex items-center gap-2 rounded-full
                   border border-emerald-400/25 bg-emerald-400/8
                   px-4 py-1.5 text-xs font-medium text-emerald-400
                   tracking-wide uppercase opacity-0"
        style={{ animation: "fade-in-up 0.6s ease forwards 0.2s" }}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
        Content Intelligence Layer
      </div>

      {/* ── Main headline ──────────────────────────────────────────────────── */}
      <h1
        className="relative z-10 text-center text-[clamp(3rem,7vw,5.5rem)]
                   font-bold leading-[1.06] tracking-tight opacity-0"
        style={{ animation: "fade-in-up 0.65s ease forwards 0.32s" }}
      >
        <span className="block text-zinc-100 font-light">
          Dormant wisdom
        </span>
        <span
          className="block font-extrabold"
          style={{
            background:
              "linear-gradient(135deg, #23c66c 0%, #6ee7b7 45%, #23c66c 100%)",
            backgroundSize:        "200% 200%",
            WebkitBackgroundClip:  "text",
            WebkitTextFillColor:   "transparent",
            backgroundClip:        "text",
            animation:
              "text-shimmer 5s ease infinite, fade-in-up 0.65s ease forwards 0.32s",
          }}
        >
          reborn.
        </span>
      </h1>

      {/* ── Sub-headline ───────────────────────────────────────────────────── */}
      <p
        className="relative z-10 mt-6 max-w-xl text-center text-base
                   text-zinc-400 leading-relaxed opacity-0"
        style={{ animation: "fade-in-up 0.65s ease forwards 0.48s" }}
      >
        EPIC Lab founder talks transformed into{" "}
        <span className="text-zinc-200">editor-ready briefs</span>{" "}
        across LinkedIn, X, Instagram, and short-form video — with transparent scoring.
      </p>

      {/* ── Stats pills ────────────────────────────────────────────────────── */}
      <div
        className="relative z-10 mt-10 flex items-center gap-3 opacity-0"
        style={{ animation: "fade-in-up 0.65s ease forwards 0.62s" }}
      >
        {[
          { value: talkCount,        label: "founder talks"      },
          { value: insightTotal,     label: "insights extracted" },
          { value: `${briefTotal}+`, label: "briefs generated"   },
        ].map(({ value, label }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-0.5 rounded-xl
                       border border-zinc-800 bg-zinc-900/60
                       px-5 py-3 backdrop-blur-sm"
          >
            <span className="text-2xl font-bold tabular-nums text-zinc-50">
              {value}
            </span>
            <span className="text-[11px] text-zinc-500 tracking-wide uppercase">
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Bottom gradient fade */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-24
                   bg-gradient-to-b from-transparent to-zinc-950"
        aria-hidden="true"
      />
    </section>
  );
}
