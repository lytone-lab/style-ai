# STYLE.AI — UI/UX Modernization Plan (Cal AI style)

## Goal
Modernize the dashboard UI to match Cal AI's premium, clean aesthetic: dark theme, generous spacing, large bold type, subtle glass cards, single accent color, flat/no 3D transforms, strong hierarchy, mobile-first.

## Scope
- `src/app/dashboard.module.css` (primary)
- `src/app/page.tsx` (layout/structure tweaks only, no logic changes)
- Optional: `globals.css` for base tokens/fonts

Out of scope: backend, try-on implementation (handled by Copilot), business logic.

## Design Direction (Cal AI-inspired)
- Background: near-black `#0a0a0b` with soft radial glow at top.
- Surfaces: `#141416` cards with 1px subtle border `#23232a`, no 3D perspective transforms.
- Accent: single warm accent (e.g. `#f5a623` amber or `#7c5cff` violet) used sparingly for CTAs/active states.
- Typography: larger scale — h1 36-48px, section 20px, body 14-16px; tight letter-spacing -0.02em; use system/Inter.
- Cards: 20-24px radius, 20-28px padding, soft shadow only, no perspective.
- Score dial: bigger (200px), cleaner, remove -45deg rotation hack; center value 56px.
- History rows: larger thumbnails (72px), more breathing room, no 3D.
- Floating upload FAB: larger (64px), accent fill, drop shadow.
- Remove "DEMO" streak chip noise; simplify header to brand + avatar.
- Sample notice: subtle pill, not dot.
- Responsive: single column under 768px, comfortable tap targets (44px min).

## Concrete Improvements
1. Replace tiny 8-11px font sizes with 12-16px baseline; scale headings up.
2. Remove all `perspective()` / `rotateX()` transforms.
3. Flatten card gradients to solid surface + subtle border; reduce shadow intensity.
4. Increase radius from 15-16px to 20-24px.
5. Add top radial glow background.
6. Unify spacing scale (8/12/16/24/32/48).
7. Make score dial the hero; metrics as 3 compact tiles with progress rings.
8. Simplify header: brand left, profile right, remove streak.
9. History: bigger thumbs, score as colored badge, color swatches larger.
10. Empty/loading states: skeleton shimmer while analyzing.
11. Accessibility: focus rings, aria labels (already decent), contrast check (muted text ≥ 4.5:1).
12. Motion: 200ms ease-out, respect prefers-reduced-motion.

## Validation
- `npm run typecheck` && `npm run lint`
- Visual check at 375/768/1280 widths
- Lighthouse accessibility ≥ 90

## Open Questions
- Accent color preference (amber vs violet vs white-only)?
- Light mode needed or dark-only?
