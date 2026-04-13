"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/",           label: "Talks"      },
  { href: "/voice-pack", label: "Voice Pack" },
  { href: "/about",      label: "About"      },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md border-b border-zinc-800/60 bg-zinc-950/70">
      <div className="max-w-7xl mx-auto px-8 h-14 flex items-center justify-between">

        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 group select-none"
        >
          {/* Echo pulse dot */}
          <span className="relative flex h-2.5 w-2.5">
            <span
              className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"
              style={{ animation: "echo-ring 2.4s ease-out infinite" }}
            />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </span>

          <span className="text-sm font-semibold tracking-tight text-zinc-100 group-hover:text-white transition-colors">
            EPIC{" "}
            <span className="font-light text-zinc-400 group-hover:text-zinc-300 transition-colors">
              Echo
            </span>
          </span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          {navLinks.map(({ href, label }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "px-3.5 py-1.5 rounded-md text-sm transition-all duration-150",
                  active
                    ? "text-emerald-400 bg-emerald-400/8 font-medium"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60"
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
