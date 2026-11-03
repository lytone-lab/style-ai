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

## UI/UX Laws & Behavioral Design (STRICT RULES)
The app must weaponize these cognitive principles to maximize conversion and retention:
- **Hick's Law:** Minimize decisions. (e.g., Replace complex text-editing grids with a single, intuitive visual slider for cropping).
- **Fitts's Law:** Make primary actions massive and reachable. (e.g., h-[72px] sticky bottom buttons, large touch targets).
- **Jakob's Law:** Use familiar patterns. (e.g., Standard bottom sheets, native range sliders).
- **Law of Proximity:** Group related elements visually. (e.g., Image, title, and CPW inside a single bordered card).
- **Miller's Law (7±2):** Reduce cognitive load. Show max 3 items per card or use visual badges (+3 items) instead of long text lists.
- **The IKEA Effect:** Users value what they help create. Forcing a quick manual crop makes them invest in their digital closet.

## Network & Installation Workarounds (Windows)
If `npm install` hangs indefinitely or throws `ECONNRESET` (common on this network), do not wait. 
1. Terminate the hanging process (`Ctrl + C`).
2. Switch to the global mirror: `npm.cmd config set registry https://registry.npmmirror.com`
3. Run install with visible logging: `npm.cmd install --legacy-peer-deps --no-audit --no-fund --loglevel http`
4. Once finished, reset the registry: `npm.cmd config set registry https://registry.npmjs.org` and `npm.cmd config set loglevel notice`.

## SYSTEM RULES FOR AI (STRICT COMPLIANCE)
1. **Three Variations:** For every patch, the AI MUST provide exactly 3 distinct variations (Minimal, Advanced, Premium). The user will choose one.
2. **Skeleton Loaders:** NO SPINNERS OR LOADING TEXT. Use skeletal loading states that mimic the exact layout of the final component.
3. **UX Law/Reference Explainers:** For every feature, the AI must explain the UI/UX laws applied and reference how top apps (Instagram, Cal AI, Vogue) solve the same problem.
4. **Audit & Update:** We log critiques in a specific section. Once a feature is fully fixed and approved, we update the GitHub repo.

## THE AUDIT LOG (CRITIQUES TO FIX)
- [ ] **Fake Math:** Remove random cost-per-wear (CPW). Show "Wear Count" only until user inputs price.
- [ ] **Arbitrage Crash:** `api/arbitrage` crashes because it parses objects as strings. Fix parsing and remove fake fallback text.
- [ ] **Security:** `/api/outfit-check` needs an auth guard. Database queries need `.eq("user_id", user.id)`.
- [ ] **Contrast:** Text on black must be `#888888` or brighter (remove all `#555`/`#444` for accessibility).
- [ ] **Skeleton Loaders:** Replace all textual "Loading..." states with visual skeletons.
- [ ] **Legal:** Add Privacy Policy, Terms, and fix the broken public storage bucket issue.
- [ ] **Landing Page:** Remove the hardcoded "92% Harmony" claim or label it as an example.

## SECURITY SPRINT (PATH B - PENDING)
- **Current State:** Storage bucket is Public. App uses `getPublicUrl()`.
- **Goal:** Make bucket Private. Refactor `saveToCloset`, `closet/page.tsx`, and `dashboard/page.tsx` to use `supabase.storage.from('outfits').createSignedUrl(path, 3600)`.
- **Impact:** Temporary 1-hour URLs for images. Zero public access. Total privacy for users.

## UI REWORK QUEUE
- [x] Closet: Fixed image overlap, added Hero Drop-Cap, fixed contrast.
- [x] Dashboard: Fixed broken images, added skeleton loader, fixed user filtering.
- [ ] **Analyze/Outfit Results:** Fix cut-off Harmony ring. Fix cramped Detected Items (slider badges overlapping). Fix empty bottom space. Apply editorial typography.
- [ ] **Analyze/Outfit Loading:** User prefers the cinematic blurred background with the checklist (keep as is).
- [ ] **Landing Page:** Remove hardcoded 92% score. Add legal footer links.
- [ ] **Security:** Implement Signed URLs (Path B) for private storage bucket.

## ROADMAP: CROP & ISOLATION TIERS
- **Free Tier (Current):** Manual "Mobile Photoshop" crop. User drags and zooms to isolate the garment. 
- **Paid Tier (Future):** Integrate Fal.ai. When a user scans a photo, the AI automatically segments the person, isolates each garment (even hidden ones like a shirt under a jacket), renders a full version of the occluded item, and removes the human entirely.
