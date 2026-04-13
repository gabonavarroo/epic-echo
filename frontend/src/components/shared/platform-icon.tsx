import { cn } from "@/lib/utils";
import type { Platform } from "@/lib/types";

// ── Platform config ───────────────────────────────────────────────────────────

const CONFIG: Record<
  Platform,
  { label: string; abbr: string; colorClass: string; bgClass: string; borderClass: string }
> = {
  linkedin: {
    label:       "LinkedIn",
    abbr:        "in",
    colorClass:  "text-sky-400",
    bgClass:     "bg-sky-400/10",
    borderClass: "border-sky-400/25",
  },
  x: {
    label:       "X",
    abbr:        "𝕏",
    colorClass:  "text-zinc-200",
    bgClass:     "bg-zinc-300/8",
    borderClass: "border-zinc-500/30",
  },
  instagram_carousel: {
    label:       "IG Carousel",
    abbr:        "ig",
    colorClass:  "text-pink-400",
    bgClass:     "bg-pink-400/10",
    borderClass: "border-pink-400/25",
  },
  short_form_video: {
    label:       "Video",
    abbr:        "▶",
    colorClass:  "text-orange-400",
    bgClass:     "bg-orange-400/10",
    borderClass: "border-orange-400/25",
  },
};

// ── Component ─────────────────────────────────────────────────────────────────

interface PlatformBadgeProps {
  platform:   Platform;
  size?:      "sm" | "md";
  showLabel?: boolean;
  className?: string;
}

export function PlatformBadge({
  platform,
  size      = "md",
  showLabel = true,
  className,
}: PlatformBadgeProps) {
  const { label, abbr, colorClass, bgClass, borderClass } = CONFIG[platform];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border font-medium",
        bgClass, borderClass, colorClass,
        size === "sm" && "px-1.5 py-0.5 text-[11px]",
        size === "md" && "px-2   py-0.5 text-xs",
        className
      )}
    >
      {showLabel ? label : abbr}
    </span>
  );
}

// Dot-only variant — compact visual accent for column headers, card footers, etc.
export function PlatformDot({ platform, className }: { platform: Platform; className?: string }) {
  const { colorClass } = CONFIG[platform];
  return (
    <span
      className={cn("inline-block h-2 w-2 rounded-full", colorClass, className)}
      style={{ background: "currentColor", opacity: 0.7 }}
    />
  );
}

export function platformColor(platform: Platform) {
  return CONFIG[platform];
}
