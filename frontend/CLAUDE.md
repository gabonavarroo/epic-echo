# EPIC Echo Frontend

Next.js 15 App Router + TypeScript + Tailwind + shadcn/ui.

## Structure
- src/app/ — Routes (landing, talks/[id], voice-pack, about)
- src/components/ — Component tree (landing/, editorial/, brief/, voice-pack/, shared/, ui/)
- src/lib/ — Supabase client, publish logic, types, utils

## Rules
- Read from Supabase directly via @supabase/supabase-js. NEVER call the Python backend.
- Use shadcn/ui components for all UI. Do not install other UI libraries.
- Server components by default. Use 'use client' only for: react-player, interactive state, clipboard API.
- All data types in lib/types.ts mirror the Pydantic models exactly.
- Desktop-only design. No mobile responsive work.
- Every screen must look polished at 4K resolution.

## Routes
- / → Landing page (3 talk cards)
- /talks/[id] → Editorial Board (kanban + Resonance Meter) — THE HERO SCREEN
- /voice-pack → Voice Pack showcase (structural + semantic profiles)
- /about → Architecture diagram + thesis + roadmap

## Key Components
- brief-drawer.tsx — Sheet overlay with full brief, video player, score, publish buttons
- kanban-board.tsx — Column layout groupable by Platform or Stage
- resonance-meter.tsx — Stats bar: briefs count, platforms, time saved
- video-player.tsx — react-player wrapper ('use client'), seeks to timestamp

## Running
```bash
cd frontend
npm run dev    # http://localhost:3000
npm run build  # Production build check
```
