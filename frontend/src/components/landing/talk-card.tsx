import Image from "next/image";
import Link from "next/link";
import { getYoutubeThumbnail, formatDuration } from "@/lib/utils";
import type { Talk, TalkStatus } from "@/lib/types";

interface TalkCardProps {
  talk:         Talk;
  insightCount: number;
  briefCount:   number;
  index:        number;   // used for staggered entrance animation
}

type NonCompletedTalkStatus = Exclude<TalkStatus, "completed">;

// Platform icon colors - small visual hint in the card footer
const PLATFORM_DOTS = [
  { label: "LinkedIn",    color: "bg-sky-400"     },
  { label: "X",           color: "bg-zinc-300"    },
  { label: "IG Carousel", color: "bg-pink-400"    },
  { label: "Video",       color: "bg-orange-400"  },
];

const STATUS_META: Record<NonCompletedTalkStatus, {
  badgeLabel: string;
  badgeClass: string;
  ctaLabel: string;
}> = {
  pending: {
    badgeLabel: "Pending",
    badgeClass: "border-zinc-600/50 bg-zinc-900/80 text-zinc-300",
    ctaLabel: "Processing Talk",
  },
  transcribing: {
    badgeLabel: "Transcribing",
    badgeClass: "border-sky-400/40 bg-sky-400/12 text-sky-300",
    ctaLabel: "Processing Talk",
  },
  extracting: {
    badgeLabel: "Extracting",
    badgeClass: "border-amber-400/40 bg-amber-400/12 text-amber-300",
    ctaLabel: "Processing Talk",
  },
  failed: {
    badgeLabel: "Failed",
    badgeClass: "border-rose-400/40 bg-rose-400/12 text-rose-300",
    ctaLabel: "Processing Failed",
  },
};

export default function TalkCard({ talk, insightCount, briefCount, index }: TalkCardProps) {
  const thumbnail = getYoutubeThumbnail(talk.youtube_url);
  const delay     = 0.62 + index * 0.12; // staggered entrance
  const isCompleted = talk.status === "completed";
  const statusMeta = isCompleted
    ? null
    : STATUS_META[talk.status as NonCompletedTalkStatus];

  return (
    <article
      className="group relative flex flex-col rounded-2xl border border-zinc-800/70
                 bg-zinc-900/60 overflow-hidden backdrop-blur-sm
                 transition-all duration-300 ease-out
                 hover:border-zinc-700 hover:bg-zinc-900 hover:shadow-[0_0_32px_rgba(35,198,108,0.07)]
                 hover:-translate-y-0.5 opacity-0"
      style={{ animation: `card-appear 0.55s ease forwards ${delay}s` }}
    >
      {/* Thumbnail */}
      <div className="relative w-full aspect-video overflow-hidden bg-zinc-800">
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={`Thumbnail for ${talk.title}`}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 1280px) 33vw, 400px"
            priority={index === 0}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-600 text-xs">
            No thumbnail
          </div>
        )}

        {statusMeta && (
          <span
            className={`absolute top-2 left-2 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusMeta.badgeClass}`}
          >
            {statusMeta.badgeLabel}
          </span>
        )}

        {/* Duration badge */}
        {talk.duration_sec && (
          <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-1.5 py-0.5
                           text-[11px] font-medium text-zinc-200 backdrop-blur-sm">
            {formatDuration(talk.duration_sec)}
          </span>
        )}

        {/* Subtle gradient overlay at bottom of thumbnail */}
        <div className="absolute inset-x-0 bottom-0 h-12
                        bg-gradient-to-t from-zinc-900/70 to-transparent pointer-events-none" />
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 gap-4 p-5">

        {/* Title + speaker */}
        <div className="flex flex-col gap-1">
          <h2 className="text-[15px] font-semibold leading-snug text-zinc-50
                         line-clamp-2 group-hover:text-white transition-colors">
            {talk.title}
          </h2>
          <p className="text-[13px] text-zinc-500">
            {talk.speaker_name}
          </p>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-2">
          <StatPill value={insightCount} label="insights" color="emerald" />
          <StatPill value={briefCount}   label="briefs"   color="violet"  />
        </div>

        {/* Platform dots */}
        <div className="flex items-center gap-1.5 mt-auto">
          {PLATFORM_DOTS.map(({ label, color }) => (
            <span
              key={label}
              title={label}
              className={`h-1.5 w-1.5 rounded-full ${color} opacity-50`}
            />
          ))}
          <span className="text-[11px] text-zinc-600 ml-0.5">4 platforms</span>
        </div>

        {/* CTA button */}
        {isCompleted ? (
          <Link
            href={`/talks/${talk.id}`}
            className="mt-1 flex items-center justify-center gap-1.5 rounded-xl
                       border border-emerald-500/30 bg-emerald-500/10
                       px-4 py-2.5 text-[13px] font-medium text-emerald-400
                       transition-all duration-200
                       hover:bg-emerald-500/18 hover:border-emerald-500/50 hover:text-emerald-300
                       active:scale-[0.98]"
          >
            Manage Briefs
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
            >
              <path
                fillRule="evenodd"
                d="M2 8a.75.75 0 0 1 .75-.75h8.69L9.22 5.03a.75.75 0 0 1 1.06-1.06l3.5 3.5a.75.75 0 0 1 0 1.06l-3.5 3.5a.75.75 0 1 1-1.06-1.06l2.22-2.22H2.75A.75.75 0 0 1 2 8Z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="mt-1 flex items-center justify-center rounded-xl
                       border border-zinc-700/70 bg-zinc-800/55
                       px-4 py-2.5 text-[13px] font-medium text-zinc-500
                       cursor-not-allowed"
          >
            {statusMeta?.ctaLabel ?? "Processing Talk"}
          </button>
        )}
      </div>
    </article>
  );
}

// Small helper

function StatPill({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color: "emerald" | "violet";
}) {
  const styles =
    color === "emerald"
      ? "bg-emerald-400/8 border-emerald-400/20 text-emerald-400"
      : "bg-violet-400/8 border-violet-400/20 text-violet-400";

  return (
    <div
      className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 ${styles}`}
    >
      <span className="text-[13px] font-semibold tabular-nums">{value}</span>
      <span className="text-[11px] opacity-70">{label}</span>
    </div>
  );
}