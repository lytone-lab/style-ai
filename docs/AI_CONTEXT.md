# STYLE AI - PROJECT CONTEXT & AI ONBOARDING

## Vision
Build a billion-dollar, Cal AI-inspired mobile-first PWA for fashion. It transitions from a simple outfit analyzer into a daily habit loop tracking Wardrobe Economy, Cost-Per-Wear, and Predictive Contextual Styling.

## Tech Stack
- **Framework:** Next.js 15.5 (App Router, Webpack, `next.config.ts` configured for Windows SWC).
- **Styling:** Tailwind CSS (Mobile-first strict container: `max-w-md mx-auto`, dark mode `#000000` base, `#111111` cards, `#FFFFFF` text, massive font-black typography).
- **Database:** Supabase Cloud (Currently only Waitlist is wired. Auth and Cloud Sync are the next priority).
- **AI:** Groq Cloud (`qwen/qwen3.8-27b` for Vision), MediaPipe (`@mediapipe/tasks-vision` for local face mesh/undertone analysis).
- **Deployments:** GitHub Actions CI, pushing to `https://github.com/lytone-lab/style-ai`.

## Current State (What is built)
1. **Landing Page (`/`)**: Mobile-locked Cal AI UI with massive buttons.
2. **Dashboard (`/dashboard`)**: SVG Harmony Ring, localStorage history, bottom navigation.
3. **Outfit Analyzer (`/analyze/outfit`)**: Uploads to Groq, gets Vibe, Archetype, Score, and 3 Fixes. Uses a full-screen sequential loading state.
4. **Color Analyzer (`/analyze/color`)**: MediaPipe face tracking with a dense cinematic white mesh. Calculates undertone via CIELAB math.
5. **Virtual Studio (`/dashboard/try-on`)**: Preview mode for virtual try-on (Canvas pan/zoom, garment carousel). No Fal.ai integration yet.

## Immediate Next Steps (The Roadmap)
- **Phase 1:** Setup Supabase Authentication (Email/Password & OAuth) and replace `localStorage` with Cloud Database.
- **Phase 2:** Digital Closet & Cost-Per-Wear.
- **Phase 3:** Coarse-to-Fine Adjuster & Arbitrage Engine.
- **Phase 4:** True AI Try-on (Fal.ai) and AI Chat Stylist.

## AI Instructions
- **Commands:** Always provide PowerShell commands to write files using here-strings (`@' ... '@ | Set-Content -Path "..." -Encoding utf8`).
- **System Constraints:** Execution policies might block npm. Remind the user to run `Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force` if needed.
- **UI Rules:** NEVER use glassmorphism or soft clay shadows. Strict Cal AI / Neo-Brutalist aesthetic. 1px borders (`border-[#222222]`), stark white buttons.
- **Errors:** If Next.js throws a TensorFlow console error, override `console.log`, `console.info`, and `console.warn` in the `detectForVideo` loop.
