"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { formatTimestamp, extractYoutubeId } from "@/lib/utils";

// Load react-player only in the browser — it accesses window/document.
// Cast to ComponentType<any> so we can pass all ReactPlayer props (src, ref, etc.)
// without fighting dynamic()'s inferred type, which strips non-standard props.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ReactPlayer = dynamic(
  () => import("react-player").then((mod) => mod.default),
  {
    ssr:     false,
    loading: () => (
      <div className="aspect-video w-full animate-pulse rounded-xl bg-zinc-800" />
    ),
  }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
) as React.ComponentType<any>;

interface VideoPlayerProps {
  src:           string;
  seekToSeconds: number | null;
}

function normalizeTimestampedSource(src: string, seekToSeconds: number | null): string {
  const safeTimestamp =
    seekToSeconds === null ? null : Math.max(0, Math.floor(seekToSeconds));

  const videoId = extractYoutubeId(src);
  if (videoId) {
    if (safeTimestamp === null) {
      return `https://www.youtube.com/watch?v=${videoId}`;
    }
    return `https://www.youtube.com/watch?v=${videoId}&t=${safeTimestamp}s`;
  }

  try {
    const url = new URL(src);
    url.searchParams.delete("t");
    url.searchParams.delete("start");
    url.hash = "";
    if (safeTimestamp !== null) {
      url.searchParams.set("t", `${safeTimestamp}s`);
    }
    return url.toString();
  } catch {
    return src;
  }
}

export default function VideoPlayer({ src, seekToSeconds }: VideoPlayerProps) {
  const [hasError, setHasError] = useState(false);

  const playerSrc = useMemo(
    () => normalizeTimestampedSource(src, seekToSeconds),
    [src, seekToSeconds]
  );

  return (
    <div className="flex flex-col gap-2">
      {/* 16:9 aspect-ratio wrapper */}
      <div className="relative w-full overflow-hidden rounded-xl bg-zinc-900 aspect-video">
        {hasError ? (
          <div className="flex h-full w-full items-center justify-center px-6 text-center">
            <div className="flex flex-col gap-2">
              <p className="text-sm text-zinc-300">Couldn't load the embedded video.</p>
              <a
                href={playerSrc}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
              >
                Open on YouTube
              </a>
            </div>
          </div>
        ) : (
          <ReactPlayer
            src={playerSrc}
            onLoadStart={() => setHasError(false)}
            onError={() => setHasError(true)}
            controls
            width="100%"
            height="100%"
            style={{ position: "absolute", top: 0, left: 0 }}
          />
        )}
      </div>

      {seekToSeconds !== null && (
        <p className="text-[11px] text-zinc-400">
          Cued to{" "}
          <span className="font-mono text-zinc-300">
            {formatTimestamp(seekToSeconds)}
          </span>{" "}
          — the source moment in the talk. {hasError && "Use the link above if embed is blocked."}
        </p>
      )}
    </div>
  );
}
