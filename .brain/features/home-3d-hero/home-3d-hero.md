# Feature: Home 3D Hero

_Last updated: 2026-07-21_

## Purpose
Minimalist desktop.fm-style landing page: React Three Fiber chrome 3D object with neon-green laser accents inside a macOS-chrome white card, monochrome UI, name/role headline, SF Mono corner labels. Full spec: `.brain/high-level-architecture/design-language.md` (HOME section).

## When It's Used
- Visitor lands on `/` (public)
- Nav links out to /projects and /marketplace

## How It Works
Static route — no loader at all (the template's `redirectIfAuthenticated` was intentionally dropped: a portfolio landing stays visible to signed-in users; the helper still gates `/login` + `/sign-up`). `handle = { i18n: ["home", "projects"] }` — hero copy in `home`, nav labels come from the shared `PortfolioNav` which reads `projects`.

**SSR / bundle strategy:** the R3F `<Canvas>` lives in `hero-scene.client.tsx` (React Router `.client` module — stripped from the Workers/SSR bundle by the Vite plugin). `hero-scene.tsx` wraps it with a mounted-flag + `React.lazy` pattern: silver-mist fallback block (`bg-silver-mist/30`) is rendered server-side and during hydration, the 928 kB three.js chunk only downloads client-side after mount. Server build ships a 0.07 kB stub.

**Scene:** one chrome torus knot (`meshPhysicalMaterial` metalness 1 / roughness 0.08 / clearcoat 1, reflections from drei `Environment preset="studio"`) + two thin `#39ff14` laser cylinders crossing diagonally (`meshBasicMaterial`, `toneMapped={false}`) — neon green exists only in-canvas. Flat `#f1f2f3` scene background (`<color attach="background">`). Slow idle rotation on the knot + subtle mouse parallax on the group, eased frame-rate-independently via pure helpers (`parallaxTarget` + `approach` in `app/lib/hero-scene-utils.ts`). 3D is the only animated element on the page (static scroll cue, no CSS animations).

**Layout:** `PortfolioNav` (identical to `/projects`), full-viewport hero grid — headline 800 / tracking `-0.036em` (name carbon, role graphite) + ghost "View work" → `/projects` and solid `#111` "Marketplace" → `/marketplace` CTAs (both `rounded-[1.5px]`) left; `MacosFrame` (title `OBJECT_01 — CHROME`, `aspect-[4/3]`) with the scene right. SF Mono corner labels `v3.0` / `GMT+8` / `PORTFOLIO — 2026` + location·availability meta row + `SCROLL ↓` cue — labels untranslated design tokens, location/availability translated.

### Persistence details
- None (static). No runtime assets beyond the drei "studio" environment preset.

### Testability
- Unit tests: `app/lib/__tests__/hero-scene-utils.test.ts` (12 tests — clamp, parallax mapping/clamping, exponential approach incl. delta-clamp on tab refocus)
- feature-verifier walk → **PASS** — [`verifications/2026-07-21.md`](verifications/2026-07-21.md): 7/7 golden path (SSR testids, canvas attaches post-hydration, lazy chunk + HDR 200, CTAs navigate, corner labels, mobile 390 clean), 0 jsErrors. **Caveat:** actual 3D pixels never machine-confirmed — headless software-WebGL renders blank frame despite clean mechanics; needs one-time manual/GPU spot check.
- data-testids: `home-hero`, `hero-scene`, `hero-headline`, `hero-cta-work`, `hero-cta-marketplace`, plus `nav-*` from `PortfolioNav`

## Key Files

| File | Role |
|------|------|
| `app/routes/home.tsx` | Landing UI — nav, headline, CTAs, corner labels, framed scene |
| `app/components/hero-scene.tsx` | SSR-safe wrapper — mounted flag + lazy import + silver-mist fallback |
| `app/components/hero-scene.client.tsx` | R3F canvas — chrome torus knot, lasers, parallax (`.client` = client-bundle only) |
| `app/lib/hero-scene-utils.ts` | Pure math helpers (`clamp`, `parallaxTarget`, `approach`) — three-free, unit-tested |
| `app/components/portfolio-nav.tsx` | Shared slim nav (reused, unchanged) |
| `app/components/macos-frame.tsx` | Reusable window-chrome card (reused, unchanged) |
| `app/locales/{en,zh}/home.json` | Hero copy (namespace rewritten — starter marketing keys deleted) |

## Dependencies
- `three`, `@react-three/fiber`, `@react-three/drei` (+ dev `@types/three`)
- Design spec: design-language.md

## Tagged Errors
None expected (static page).

## Changelog

| Date | Type | Description |
|------|------|-------------|
| 2026-07-21 | feature | Shipped — verify-done PASS (typecheck, 268 tests, e2e retry-green, build), feature-verifier PASS (`verifications/2026-07-21.md`, 3D-pixel caveat: needs one manual GPU spot check). |
| 2026-07-21 | feature | Built — template home replaced with 3D hero; `.client`-module SSR strategy (three.js out of Workers bundle); torus-knot + laser scene; `home` namespace rewritten en+zh; +12 unit tests. Verification + status flip pending. |
| 2026-07-21 | feature | Planned — refs: ohzi.io, Vectary, Luma Genie |
