# Run: visual-redesign

_Started: 2026-07-21_
_Status: shipped_

## Task

User rejected shipped visuals ("everything is broken"). Cross-cutting visual pass over home / projects / case-study, designed directly by the main thread (user asked for Fable-level design) against Refero references (Lusion, Yinger, Petertarka, Not Real) + desktop.fm spec.

## Domain

frontend (cross-cutting — touches feat-007/008/009 surfaces; single run note per scope-policy cross-feature rule)

## Diagnosis (from actually LOOKING at screenshots — process gap: feature-verifier asserts testids, nobody judged pixels)

1. White chrome object over `#f1f2f3` = invisible; canvas composited blank white. Corner labels white-on-white.
2. Every thumbnail/hero a flat gray fallback → whole site read as wireframe.
3. Home: viewport-filling wrapping headline beside small empty box — inverted hierarchy.
4. Duplicate section eyebrows (TOC + eyebrow + heading).
5. `SCROLL ↓` on a page that doesn't scroll.

## Changes

- `app/components/project-cover.tsx` (new) — generative editorial cover: ink plate, cropped huge title, mono slug/year, category tag, crosshair marks. Used by project cards + case-study hero when no image.
- `app/components/hero-scene.tsx` — dark DOM plate `#141416` behind transparent canvas (GPU-failure degrades to designed field); centered mono "rendering —" loading state.
- `app/components/hero-scene.client.tsx` — canvas transparent (`alpha: true`), no in-canvas background.
- `app/routes/home.tsx` — recomposed: compact statement row (h1 text-2xl/3xl + CTAs right) → full-bleed MacosFrame render plate filling viewport remainder; corner labels moved onto plate; scroll cue removed.
- `app/components/macos-frame.tsx` — flex column, content `flex-1 min-h-0` (fill fix).
- `app/components/project-card.tsx` — ProjectCover replaces gray fallback, subtle hover scale.
- `app/routes/projects/$slug.tsx` — ProjectCover hero variant; section headings now `01 Why` (mono index inline) — dedup with TOC.
- `.brain/high-level-architecture/design-language.md` — "Amendments — 2026-07-21 visual pass" section codifies all of the above.

## Verification

- typecheck exit 0; 268/268 tests; build PASS.
- Self-reviewed screenshots (1440px, Playwright, my own eyes): home / projects / case-study all read as designed; projects covers strongest.
- Still open: chrome knot pixels unverifiable headless (software GL) — user must eyeball on real GPU.

## Final

- Left undone: real project screenshots would beat generative covers eventually; `:lng` translation gap unchanged.
- Surprises: R3F canvas in swiftshader composites blank WHITE (not dark) — never trust `<color attach="background">` as the plate; keep the plate in DOM.
