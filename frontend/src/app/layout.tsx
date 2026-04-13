import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Nav from "@/components/nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EPIC Echo",
  description:
    "Content intelligence layer — transforms EPIC Lab founder talks into editor-ready briefs across LinkedIn, X, Instagram, and short-form video.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="relative min-h-full flex flex-col">
        {/*
          Ambient glow layer — fixed behind all page content.
          Two slow-breathing brand-colored orbs give depth without noise.
          Opacity values kept very low so it feels like light, not paint.
        */}
        <div
          className="fixed inset-0 pointer-events-none select-none"
          aria-hidden="true"
          style={{ zIndex: 0 }}
        >
          {/* Primary orb — top center, larger, slower */}
          <div
            className="absolute"
            style={{
              top: "-25%",
              left: "20%",
              right: "20%",
              height: "60%",
              background:
                "radial-gradient(ellipse at center, rgb(35 198 108 / 0.09) 0%, transparent 70%)",
              animation: "pulse-glow 11s ease-in-out infinite",
            }}
          />
          {/* Secondary orb — bottom right, smaller, offset phase */}
          <div
            className="absolute"
            style={{
              bottom: "5%",
              right: "8%",
              width: "30%",
              height: "30%",
              background:
                "radial-gradient(ellipse at center, rgb(35 198 108 / 0.04) 0%, transparent 70%)",
              animation: "pulse-glow 15s ease-in-out infinite 4s",
            }}
          />
        </div>

        {/* All page content sits above the ambient layer */}
        <div className="relative flex flex-col flex-1" style={{ zIndex: 1 }}>
          <Nav />

          {/*
            Desktop-only banner — visible ONLY on mobile/tablet viewports (< lg).
            Non-intrusive: single slim strip at top, dismissible feel via low contrast.
            Hidden on desktop (lg+) via Tailwind responsive prefix.
          */}
          <div className="lg:hidden flex items-center justify-center gap-2
                          border-b border-amber-500/20 bg-amber-500/5
                          px-4 py-2.5 text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              className="h-3.5 w-3.5 flex-shrink-0 text-amber-500/70"
            >
              <path
                fillRule="evenodd"
                d="M6.701 2.25c.577-1 2.02-1 2.598 0l5.196 9a1.5 1.5 0 0 1-1.299 2.25H2.804a1.5 1.5 0 0 1-1.3-2.25l5.197-9ZM8 4a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-[12px] text-amber-500/80">
              EPIC Echo is optimized for desktop. For the full experience, open on a laptop or monitor.
            </p>
          </div>

          {children}
        </div>
      </body>
    </html>
  );
}
