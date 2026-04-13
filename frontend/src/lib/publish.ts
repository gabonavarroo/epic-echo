"use client";

import type { Brief } from "./types";

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function formatBriefAsText(brief: Brief): string {
  const parts = [brief.hook, "", brief.body];
  if (brief.cta) parts.push("", brief.cta);
  return parts.join("\n");
}

export async function publishToLinkedIn(brief: Brief, youtubeUrl: string): Promise<void> {
  const text = formatBriefAsText(brief);
  await copyToClipboard(text);
  window.open(
    `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(youtubeUrl)}`,
    "_blank"
  );
}

function bodyOnlyTextForX(brief: Brief): string {
  const body = brief.body.trim();
  if (!body) return "";

  const hook = brief.hook.trim();
  if (!hook) return body;

  if (body.toLocaleLowerCase().startsWith(hook.toLocaleLowerCase())) {
    const deduped = body.slice(hook.length).trimStart();
    return deduped || body;
  }

  return body;
}

export function publishToX(brief: Brief): void {
  const text = bodyOnlyTextForX(brief);
  const truncated = text.length > 270 ? text.slice(0, 267) + "..." : text;
  window.open(
    `https://twitter.com/intent/tweet?text=${encodeURIComponent(truncated)}`,
    "_blank"
  );
}

export async function copyInstagramScript(brief: Brief): Promise<void> {
  if (brief.platform === "instagram_carousel" && brief.structured_payload) {
    const payload = brief.structured_payload as {
      slides: { slide_number: number; headline: string; body: string }[];
      cover_headline: string;
      closing_cta: string;
    };
    const text = [
      `COVER: ${payload.cover_headline}`,
      "",
      ...payload.slides.map(
        (s) => `SLIDE ${s.slide_number}: ${s.headline}\n${s.body}`
      ),
      "",
      `CTA: ${payload.closing_cta}`,
    ].join("\n");
    await copyToClipboard(text);
  } else {
    await copyToClipboard(formatBriefAsText(brief));
  }
}

export async function downloadVideoClipPack(brief: Brief, youtubeUrl: string): Promise<void> {
  const pack = {
    youtube_url: youtubeUrl,
    ...(brief.structured_payload ?? {}),
    source_timestamp_start: brief.source_timestamp_start,
    source_timestamp_end: brief.source_timestamp_end,
  };

  const blob = new Blob([JSON.stringify(pack, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `epic-echo-clip-pack-${brief.id.slice(0, 8)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function openInCapCut(): void {
  window.open("https://www.capcut.com", "_blank");
}

function getCarouselPdfFilename(brief: Brief): string {
  return `epic-echo-carousel-${brief.id.slice(0, 8)}.pdf`;
}

export async function emailBrief(brief: Brief): Promise<void> {
  const subject = encodeURIComponent(brief.hook);

  if (brief.platform === "instagram_carousel" && brief.structured_payload) {
    const pdfFilename = getCarouselPdfFilename(brief);
    await downloadCarouselPDF(brief);

    const emailBody = encodeURIComponent(
      [
        "Carousel brief:",
        "",
        formatBriefAsText(brief),
        "",
        `Please attach the downloaded PDF before sending: ${pdfFilename}`,
      ].join("\n")
    );

    window.open(`mailto:?subject=${subject}&body=${emailBody}`);
    return;
  }

  const body = encodeURIComponent(formatBriefAsText(brief));
  window.open(`mailto:?subject=${subject}&body=${body}`);
}

export async function downloadCarouselPDF(brief: Brief): Promise<void> {
  const { jsPDF } = await import("jspdf");

  if (brief.platform !== "instagram_carousel" || !brief.structured_payload) {
    return;
  }

  const payload = brief.structured_payload as {
    slides: { slide_number: number; headline: string; body: string; visual_note: string }[];
    cover_headline: string;
    closing_cta: string;
  };

  // Instagram 4:5 aspect ratio: 1080 × 1350 → scale to PDF units
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "px",
    format: [1080, 1350],
  });

  const addSlide = (title: string, body: string, visual: string, pageIndex: number) => {
    if (pageIndex > 0) doc.addPage();

    // Background
    doc.setFillColor(10, 10, 10);
    doc.rect(0, 0, 1080, 1350, "F");

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(64);
    doc.setFont("helvetica", "bold");
    doc.text(title, 80, 200, { maxWidth: 920 });

    // Body
    doc.setFontSize(36);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(200, 200, 200);
    doc.text(body, 80, 380, { maxWidth: 920 });

    // Visual note
    doc.setFontSize(28);
    doc.setTextColor(120, 120, 120);
    doc.text(`[Visual: ${visual}]`, 80, 1200, { maxWidth: 920 });
  };

  // Cover slide
  addSlide(payload.cover_headline, "", "", 0);

  // Content slides
  payload.slides.forEach((slide, i) => {
    addSlide(slide.headline, slide.body, slide.visual_note, i + 1);
  });

  // CTA slide
  addSlide(payload.closing_cta, "", "", payload.slides.length + 1);

  doc.save(getCarouselPdfFilename(brief));
}
