import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Platform, JourneyStage } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number | null): string {
  if (!seconds) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

export function formatTimestamp(seconds: number | null): string {
  if (seconds === null || seconds === undefined) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatScore(score: number | null): string {
  if (score === null || score === undefined) return "—";
  return score.toString();
}

export function getScoreColor(score: number | null): string {
  if (score === null) return "text-muted-foreground";
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-yellow-400";
  return "text-orange-400";
}

export function getScoreBg(score: number | null): string {
  if (score === null) return "bg-muted";
  if (score >= 80) return "bg-emerald-400/10 border-emerald-400/30";
  if (score >= 60) return "bg-yellow-400/10 border-yellow-400/30";
  return "bg-orange-400/10 border-orange-400/30";
}

export function platformLabel(platform: Platform): string {
  const labels: Record<Platform, string> = {
    linkedin: "LinkedIn",
    x: "X",
    instagram_carousel: "IG Carousel",
    short_form_video: "Video",
  };
  return labels[platform];
}

export function stageLabel(stage: JourneyStage): string {
  const labels: Record<JourneyStage, string> = {
    curious_explorer: "Curious Explorer",
    first_builder: "First Builder",
    growth_navigator: "Growth Navigator",
    ecosystem_leader: "Ecosystem Leader",
  };
  return labels[stage];
}

export function estimateTimeSaved(briefCount: number): string {
  const totalMinutes = briefCount * 45;
  const hours = Math.round(totalMinutes / 60);
  return `${hours}h`;
}

export function getYoutubeThumbnail(youtubeUrl: string): string {
  const videoId = extractYoutubeId(youtubeUrl);
  if (!videoId) return "";
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

export function extractYoutubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  return match?.[1] ?? null;
}
