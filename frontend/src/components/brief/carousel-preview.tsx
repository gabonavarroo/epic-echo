// Slide-by-slide preview for instagram_carousel briefs.
// Horizontally scrollable mini-cards resembling the actual Instagram format.

import type { CarouselPayload } from "@/lib/types";

interface CarouselPreviewProps {
  payload: CarouselPayload;
}

export default function CarouselPreview({ payload }: CarouselPreviewProps) {
  // Build full slide sequence: cover → content slides → CTA
  const allSlides = [
    {
      label:      "Cover",
      headline:   payload.cover_headline,
      body:       null,
      visualNote: null,
      accent:     "text-pink-400 bg-pink-400/8 border-pink-400/20",
    },
    ...payload.slides.map((s) => ({
      label:      `Slide ${s.slide_number}`,
      headline:   s.headline,
      body:       s.body,
      visualNote: s.visual_note,
      accent:     "text-zinc-300 bg-zinc-800/60 border-zinc-700",
    })),
    {
      label:      "CTA",
      headline:   payload.closing_cta,
      body:       null,
      visualNote: null,
      accent:     "text-emerald-400 bg-emerald-400/8 border-emerald-400/20",
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-zinc-600 uppercase tracking-widest font-medium">
          Carousel Preview
        </span>
        <span className="text-[10px] text-zinc-700">
          {payload.slides.length} content slides
        </span>
      </div>

      <div
        className="flex gap-2.5 overflow-x-auto pb-2"
        style={{ scrollbarWidth: "thin" }}
      >
        {allSlides.map((slide, i) => (
          <div
            key={i}
            className="flex-none w-[155px] rounded-xl border border-zinc-800
                       bg-zinc-900/80 p-3 flex flex-col gap-2
                       hover:border-zinc-700 transition-colors"
          >
            {/* Slide label */}
            <span
              className={`inline-flex w-fit rounded-md border px-1.5 py-0.5
                          text-[9px] font-semibold uppercase tracking-wider
                          ${slide.accent}`}
            >
              {slide.label}
            </span>

            {/* Headline */}
            <p className="text-[12px] font-semibold text-zinc-100 leading-tight line-clamp-3 flex-1">
              {slide.headline}
            </p>

            {/* Body (content slides only) */}
            {slide.body && (
              <p className="text-[11px] text-zinc-500 leading-relaxed line-clamp-3">
                {slide.body}
              </p>
            )}

            {/* Visual note */}
            {slide.visualNote && (
              <p className="text-[10px] text-zinc-700 italic line-clamp-2 mt-auto border-t border-zinc-800 pt-1.5">
                📷 {slide.visualNote}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
