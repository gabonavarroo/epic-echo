import { cn, getScoreColor } from "@/lib/utils";

interface ScoreBadgeProps {
  score:     number | null;
  size?:     "sm" | "md" | "lg";
  className?: string;
}

export function ScoreBadge({ score, size = "md", className }: ScoreBadgeProps) {
  if (score === null || score === undefined) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-md border border-zinc-700 bg-zinc-800 font-mono text-zinc-500",
          size === "sm" && "px-1.5 py-0.5 text-[11px]",
          size === "md" && "px-2   py-0.5 text-xs",
          size === "lg" && "px-2.5 py-1   text-sm",
          className
        )}
      >
        —
      </span>
    );
  }

  const colorClass = getScoreColor(score);
  const bgClass =
    score >= 80
      ? "bg-emerald-400/10 border-emerald-400/25"
      : score >= 60
      ? "bg-yellow-400/10 border-yellow-400/25"
      : "bg-orange-400/10 border-orange-400/25";

  // Emoji indicator for standout scores
  const indicator = score >= 85 ? "✦ " : score >= 80 ? "" : "";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md border font-mono font-semibold tabular-nums",
        bgClass,
        colorClass,
        size === "sm" && "px-1.5 py-0.5 text-[11px]",
        size === "md" && "px-2   py-0.5 text-xs",
        size === "lg" && "px-2.5 py-1   text-sm font-bold",
        className
      )}
    >
      {indicator}
      {score}
    </span>
  );
}
