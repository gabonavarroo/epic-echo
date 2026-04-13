"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  publishToLinkedIn,
  publishToX,
  copyInstagramScript,
  downloadCarouselPDF,
  downloadVideoClipPack,
  openInCapCut,
  emailBrief,
  copyToClipboard,
  formatBriefAsText,
} from "@/lib/publish";
import type { Brief, Platform, ShortVideoPayload } from "@/lib/types";

// ── Platform-specific action configs ─────────────────────────────────────────

interface PublishBarProps {
  brief:      Brief;
  youtubeUrl: string;
}

export default function PublishBar({ brief, youtubeUrl }: PublishBarProps) {
  const [toast, setToast] = useState<string | null>(null);
  const platform = brief.platform as Platform;
  const emailLabel = platform === "instagram_carousel" ? "Email + PDF" : "Email";

  function notify(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  async function run(fn: () => void | Promise<void>, msg?: string) {
    try {
      await fn();
      if (msg) notify(msg);
    } catch {
      notify("Something went wrong — try again");
    }
  }

  return (
    <div className="relative flex-none border-t border-zinc-800/80 bg-zinc-950 px-5 py-3.5">

      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      <div
        className={cn(
          "absolute -top-11 left-1/2 -translate-x-1/2 rounded-lg border px-3 py-1.5",
          "text-xs font-medium shadow-lg pointer-events-none",
          "transition-all duration-200",
          toast
            ? "opacity-100 -translate-y-0 border-emerald-500/30 bg-zinc-900 text-emerald-400"
            : "opacity-0 translate-y-1 border-transparent"
        )}
      >
        {toast ?? ""}
      </div>

      {/* ── Button rows ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">

        {/* ── Platform-specific primary actions ───────────────────── */}
        {platform === "linkedin" && (
          <Btn
            primary
            icon={<LinkedInIcon />}
            label="Post to LinkedIn"
            onClick={() =>
              run(
                () => publishToLinkedIn(brief, youtubeUrl),
                "Brief copied. LinkedIn opened - press Ctrl+V (or Cmd+V) to paste."
              )
            }
          />
        )}

        {platform === "x" && (
          <Btn
            primary
            icon={<XIcon />}
            label="Post to X"
            onClick={() => run(() => publishToX(brief))}
          />
        )}

        {platform === "instagram_carousel" && (
          <>
            <Btn
              primary
              icon="📋"
              label="Copy Script"
              onClick={() =>
                run(() => copyInstagramScript(brief), "Carousel script copied!")
              }
            />
            <Btn
              icon="⬇"
              label="Download PDF"
              onClick={() =>
                run(() => downloadCarouselPDF(brief), "PDF downloaded!")
              }
            />
          </>
        )}

        {platform === "short_form_video" && (
          <>
            <Btn
              primary
              icon="⬇"
              label="Clip Pack"
              onClick={() =>
                run(
                  () => downloadVideoClipPack(brief, youtubeUrl),
                  "Clip pack saved!"
                )
              }
            />
            <Btn
              icon="✂"
              label="CapCut"
              onClick={() => run(() => openInCapCut())}
            />
            <Btn
              icon="📋"
              label="Caption"
              onClick={() =>
                run(
                  () =>
                    copyToClipboard(
                      (brief.structured_payload as ShortVideoPayload | null)
                        ?.caption ?? formatBriefAsText(brief)
                    ),
                  "Caption copied!"
                )
              }
            />
          </>
        )}

        {/* ── Universal actions (always shown) ────────────────────── */}
        <div className="ml-auto flex items-center gap-2">
          <Btn
            icon="✉"
            label={emailLabel}
            onClick={() =>
              run(
                () => emailBrief(brief),
                platform === "instagram_carousel"
                  ? "PDF downloaded. Attach it in the email draft."
                  : undefined
              )
            }
          />
          <Btn
            icon="📋"
            label="Copy"
            onClick={() =>
              run(
                () => copyToClipboard(formatBriefAsText(brief)),
                "Copied to clipboard!"
              )
            }
          />
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Btn({
  label,
  icon,
  primary = false,
  onClick,
}: {
  label:    string;
  icon:     React.ReactNode;
  primary?: boolean;
  onClick:  () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5",
        "text-xs font-medium transition-all duration-150 active:scale-[0.97]",
        primary
          ? "border-emerald-500/30 bg-emerald-500/12 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/50"
          : "border-zinc-700/70 bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 hover:border-zinc-600"
      )}
    >
      <span className="text-[13px] leading-none">{icon}</span>
      {label}
    </button>
  );
}

// Inline platform icons (avoid extra icon library)
function LinkedInIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
      <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854zm4.943 12.248V6.169H2.542v7.225zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248S2.4 3.226 2.4 3.934c0 .694.521 1.248 1.327 1.248zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016l.016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
      <path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-.86 13.028h1.36L4.323 2.145H2.865z" />
    </svg>
  );
}
