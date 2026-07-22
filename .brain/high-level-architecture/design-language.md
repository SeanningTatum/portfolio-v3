# Design Language — portfolio-v3

> Source: desktop.fm style (styles.refero.design/style/cb266ff9) + Refero screen research (2026-07-21).
> This is the canonical visual spec. Every UI change must conform.

## Core system (desktop.fm)

- **Palette (strictly monochrome UI):**
  - Canvas Mist `#f1f2f3` — page background
  - Carbon Black `#111111` — primary text, filled buttons
  - Pure White `#ffffff` — elevated card surface
  - Graphite `#2d2d2d` — secondary surfaces
  - Pale Stone `#dddddd` — borders/dividers
  - Silver Mist `#b4b4b4` — muted backgrounds
  - **Neon green accent lives ONLY inside the 3D render — never in UI chrome.**
- **Typography:** system stack (-apple-system, BlinkMacSystemFont, Segoe UI). Weights 500 / 700 / 800 only — never lighter. Headlines 800, tracking `-0.036em`. Line-height locked to 1.25. SF Mono for technical labels at 12px / 800.
- **Radii binary:** `1.5px` (sharp — buttons, chips, badges) or `20–25px` (soft — cards, media frames). Nothing between.
- **No shadows.** Hierarchy via scale + surface inversion (white↔black), never elevation.
- **macOS window chrome** (grayscale traffic-light dots + title bar) frames media/3D cards.
- **One dominant object per viewport.** Corner-anchored SF Mono utility labels.

## Page specs

### HOME (3D hero)
Refs: ohzi.io, Vectary landing, Luma Genie viewer, Aristide Benoist.
- Slim nav: wordmark left; 3–4 text links + one filled `#111` CTA right; no border until scroll.
- Full-viewport hero: name/role headline (800, ≤2 lines) stacked/split-left of 3D object.
- Chrome 3D object (R3F) inside white 20–25px card **with macOS traffic-light chrome** — framed, not floating.
- Ghost CTA (1.5px radius) beside solid `#111` CTA.
- SF Mono micro-labels at hero corners: `v3.0`, `GMT+8`, `PORTFOLIO — 2026`.
- 3D object is the only moving thing. Flat `#f1f2f3` behind it, no gradients.
- Thin mono meta row (location, availability) + scroll cue below hero.

### /projects (list)
Refs: Kickstarter created-tab, Contra Discover, Runway talent profile.
- Oversized title ("Work", 800) + item count in SF Mono.
- Filter pill row: 1.5px-radius chips, black-on-white, inverted when active.
- 2-col grid, white cards on `#f1f2f3`.
- Card anatomy: screenshot in mini macOS-chrome frame → title (700) → one-line summary (500 gray) → SF Mono meta `YEAR · STACK · ROLE` (max 3 tokens).
- Hover: border `#dddddd → #111` + arrow slide. No lift, no shadow.
- One full-width featured card per 4 items.

### /projects/:id (case study)
Refs: Resend Handbook, Medium article, Enode customer stories.
- Title block: headline 800 + one-sentence outcome.
- SF Mono meta grid: CLIENT / ROLE / STACK / YEAR — 4 cols, hairline dividers.
- Full-width hero image in macOS-chrome card.
- **WHY / HOW / SOLUTION** sections in ~680px reading column; sticky SF Mono TOC left.
- Section headers = SF Mono eyebrows (`01 — WHY`) above 700-weight subheads.
- Paragraphs ≤3–4 lines (1.25 line-height forces it). Screenshots always window-chrome framed; images may break the column, text never does.
- Pull-quotes as 1.5px-bordered cards, not italics.
- Stats row: 3 numbers at 800 + mono captions. Prev/next project footer.

### /marketplace (skills)
Refs: Kit App Store, Todoist Integrations, Wrike directory.
- Title + search field.
- Two-column: sticky category text-list left (active = `#111` 700; NOT pills — scans better >6 categories), 3-col card grid right.
- Card: icon in 25px-radius soft square → name (700) → one-liner (500) → SF Mono footer `FREE / CATEGORY` with hairline top border.
- Badges (`NEW`) SF Mono uppercase, 1.5px radius, black outline — never colored.
- Sort dropdown top-right of grid only. No faceted filters. Uniform card heights, grid gap ≥24px.
- "Request a tool" banner above footer.

## Global rules

1. Hierarchy via scale + surface inversion, never shadows/color.
2. Tiny corner-anchored SF Mono utility labels as signature detail.
3. One dominant object per viewport.
4. 3D: React Three Fiber; chrome/glossy material, neon-green laser accents in-scene only.

## Amendments — 2026-07-21 visual pass (learned from screenshots + Lusion/Yinger refs)

- **Dark plate rule.** Chrome/metallic renders and cover art sit on an ink plate (`#141416`/`#161618`) inside the white macOS frame — a metalness-1 object over the light canvas washes out to invisible (verified via screenshots). Dark-in-light is the page's core contrast move (Lusion pattern). The plate is DOM (`hero-scene.tsx` wrapper), NOT the WebGL clear color, so a failed GPU paint still shows a designed field; the canvas is transparent and layers the object on top.
- **The render IS the hero.** Home = compact statement row (headline ≤ text-3xl) + full-bleed framed dark plate filling the viewport remainder. Never a viewport-filling headline beside a small box. Corner labels live ON the plate (muted white mono).
- **No gray voids, ever.** Missing thumbnails/heroes render `ProjectCover` (`app/components/project-cover.tsx`): ink plate, project title huge and cropped off the right edge, mono slug/year row, category tag, crosshair `+` marks. Deterministic, no assets.
- **Section eyebrows don't repeat.** Case-study headings: small mono index (`01`) inline-baseline with the heading — not a separate eyebrow line duplicating the TOC.
- **No `SCROLL ↓` cue on pages that don't scroll.**
- **MacosFrame is a flex column** — content area `flex-1 min-h-0`, so `className="flex-1"` + full-height children fill correctly.

## Amendment — 2026-07-21 "console" home (user-directed creative pass)

Refs: Dennis Snellenberg (oversized type as page event), Yinger/Phantom (dark stage, corner labels), Kirschberg (dark editorial).

- **Home is the machine.** Whole viewport = dark `#141416` stage; the R3F scene is full-bleed behind everything (`HeroScene transparent` — DOM plate is the page itself). Inner pages stay light with white macOS frames; home alone is dark.
- **Portals, not buttons.** The two destinations are giant typographic bars docked bottom (`Portal` in `home.tsx`): mono eyebrow `01 — CASE STUDIES`, label at `clamp(2.6rem,6.5vw,5.5rem)` weight 800, `↗` glyph. Rest state ghost `white/25` (desktop; `white/70` below `sm` — no hover on touch), hover fills `pure-white` + `bg-white/[0.04]` + arrow slide.
- **The scene reacts to intent.** Portal hover/focus sets `energy=1` → `HeroScene` → knot spin-up (`spinSpeed` in `hero-scene-utils.ts`, idle 0.25 → excited 1.1 rad/s, eased) + laser opacity flare 0.55 → 1.0.
- **Route changes ride view transitions.** Portal `Link viewTransition` + `@view-transition { navigation: auto }` with `vt-out`/`vt-in` (fade + 12-16px vertical slide) in `app.css`.
- **Load reveal.** `.home-reveal` staggered rise (identity 0ms, availability 250ms, portals 350/450ms). ALL motion (reveal + view transitions) gated behind `prefers-reduced-motion: no-preference`.
- Nav on home: wordmark + ghost white "Let's talk" only — the portals ARE the nav.

## Amendment — 2026-07-21 OBJECT_02 CRT + ambient sound

- **The object is a series.** `OBJECT_01 — CHROME` (torus knot, retired but kept in git history) → `OBJECT_02 — CRT`: chrome retro terminal (RoundedBox shell, neck + base) whose screen live-types an agentic coding session in phosphor green — CanvasTexture driven by the pure typing machine in `app/lib/crt-script.ts` (script lines, `advanceType`/`visibleLines`, unit-tested). Scanlines + blinking block cursor + glow. Screen must face the viewer: gentle sin sway, never a full spin. Energy (portal hover) speeds typing 13→46 cps + flares lasers.
- **Ambient sound.** `public/audio/ambient.mp3` (23s calm ambient, HeyGen catalog via media-use, faded ends, 96kbps ~277KB, ledger `.media/manifest.jsonl`). `SoundToggle` (`app/components/sound-toggle.tsx`) in the mono label stack under GMT+8: gesture-gated (autoplay policy), starts OFF every visit, volume 0.3, loops, stops on unmount. Label text = design token.

## Amendment — 2026-07-22 console v2 (sleek pass + interactive OS)

- **Chrome needs front light.** The Lightformer env must include camera-side formers (frontal + top-front panels in `hero-scene.client.tsx`) — metalness-1 surfaces mirror the empty room and render black without them. Contrast (hard bright panels, real dark gaps, one warm strip) is what makes chrome read as chrome.
- **Reflective floor + fog.** `MeshReflectorMaterial` plane (#101012, res 512, heavy blur) under the object, `<fog #141416 7→17>` so the plane's far edge melts into the DOM stage. Object sits ON the floor (group y −0.25) — no more floating.
- **Lasers are an event, not wallpaper.** Opacity 0 at rest; they sweep in only with portal-hover energy.
- **Atmosphere:** 120-point dust-mote cloud; glass streak painted on the screen canvas (drawn even when the tube is off).
- **The tube is a tiny OS.** Modes: boot (BIOS memcheck raster ritual) / terminal (attract script; typing anywhere opens a real prompt — `help`, `sudo hire sean`, `cat secrets.txt`…) / matrix / pong / starfield (click tube to cycle) / DVD screensaver (60s idle) / off (power LED click, collapse-to-line animation). Pure state machines in `app/lib/`, all unit-tested; drawing stays in the client file. Konami code deliberately absent (user-excluded).
- **Sound:** WebAudio synth (key clacks, laser zap) rides the existing SoundToggle; ambient.mp3 unchanged; no hum (ambient covers it). Devtools ASCII egg + `window.hire()` on `/`.
- Bloom/postprocessing REJECTED: new dep + EffectComposer risk vs. the WebGL stability rules below; canvas shadowBlur glow is sufficient.

## Amendment — 2026-07-21 boot loader + WebGL stability rules

- **NEVER use drei `<Environment preset>` (HDR) in this project.** The HDR fetch + PMREM generation blew up the WebGL context (~2.5s after load → scene vanished — "shows for a split second" bug) and pulled from a CDN at runtime. Use the procedural Lightformer environment in `hero-scene.client.tsx` (`<Environment resolution={128} frames={1}>` + 4 Lightformer softboxes) — local, cheap, chrome stays reflective.
- **Context-loss guard.** `ContextGuard` (in `hero-scene.client.tsx`) listens for `webglcontextlost` (preventDefault → allow restore) / `webglcontextrestored`; reports dead only after 3s without restore.
- **Boot loader.** `BootLoader` (`app/components/boot-loader.tsx`) — fullscreen ink plate over the home console: `OBJECT_02 — CRT` mono label, indeterminate hairline sweep, `BOOTING RENDER █` blink. Dismissed by the scene's real first rendered frame (`onFirstFrame` via useFrame first tick), by permanent context loss, or by a 5s hard timeout (`BOOT_TIMEOUT_MS` in `home.tsx`) — a dead GPU must never trap visitors, the dark stage + portals are a complete page. 600ms opacity fade, then unmount. Sweep/blink gated behind `prefers-reduced-motion: no-preference`.
