# Feature: Console v2

_Last updated: 2026-07-22_

## Purpose
Second pass on the home console (extends feat-007 home-3d-hero): make the render sleek (chrome that reads as chrome, reflective floor, dust atmosphere, event-driven lasers) and make the CRT a playable machine (interactive terminal, toy screen modes, screensaver, power ritual, sound design, devtools egg). Konami code explicitly excluded by user.

## When It's Used
- Visitor lands on `/` (public). Everything below is discoverable, nothing is required — the page still works as a pure landing page.

## How It Works

### Sleek pass (scene)
- **Chrome env** — procedural Lightformer cubemap (`Environment resolution={128} frames={1}`, 7 formers): hard overhead key strip + crisp left vertical + cool right fill + warm low strip + rear rim + **frontal panel + top-front panel** (the front-facing formers are load-bearing: chrome mirrors the empty room and renders black without them). HDR presets remain banned (context-loss history).
- **Reflective floor** — drei `MeshReflectorMaterial` plane at `FLOOR_Y -1.62` (blur [400,100], resolution 512, mixStrength 9, color #101012). Object group dropped to y −0.25 so the base sits just above it. `<fog #141416 7→17>` melts the plane's far edge into the DOM stage — no horizon seam. ContactShadows kept (frames=1).
- **Lasers are an event** — opacity 0 at rest, flare in with eased portal-hover energy (`heat * 0.9 / 0.8`). No more always-on diagonals.
- **Dust motes** — one `Points` cloud, 120 particles drifting upward with sine wobble, opacity 0.22, depthWrite off.
- **Glass streak** — diagonal white gradient painted in the screen canvas after the vignette; drawn even when the tube is off (glass doesn't care about power).
- **Hardware details** — brand plate, brightness/contrast knobs, vent slits, power LED with invisible 0.14-radius hit halo.

### The tube is a tiny OS (`CrtOs` in hero-scene.client.tsx)
Pure state machines in `app/lib/` (all unit-tested), canvas drawing in the client file. Modes (`crt-modes.ts`): `boot | terminal | matrix | pong | starfield | saver | off`.
- **boot** (`boot-sequence.ts`) — raster line expands → URGEL BIOS memcheck → attract terminal. Runs on load (behind the DOM BootLoader) and on LED power-on.
- **terminal** — attract mode auto-types the agentic script (`crt-script.ts`, now with progress bars/✓ beats; `scriptForHour` serves `LATE_NIGHT_SCRIPT` 00:00–05:00 local). **Typing anywhere on the page** (no form focus, no modifier) opens the interactive prompt (`crt-terminal.ts`): `help`, `whoami`, `ls`, `cat secrets.txt` (phosphor egg), `contact`, `sudo hire sean` → PERMISSION GRANTED, generic `sudo` → sudoers warning, `matrix|pong|starfield` mode switches, `clear`, `exit`, ESC leaves. Output lines capped ≤34 chars (screen row budget, enforced by test).
- **matrix / pong / starfield** — click the tube to cycle (`nextMode`). Matrix rain (`matrix-rain.ts`, hash-deterministic glyphs), self-playing pong (`pong.ts`, chase-AI paddles, hit-offset steering, real scoring), fly-through starfield (`starfield.ts`).
- **saver** (`dvd-bounce.ts`) — 60s idle (`IDLE_TO_SAVER_S`) → bouncing SEAN logo + `corners:` counter; any pointer/key wakes back to the previous mode.
- **off** — click the power LED: collapse-to-line-to-dot animation (`offFrame`), LED dims, screen goes dead glass; click again → boot.
- Portal-hover emoji takeover still overrides whatever mode is on screen (fades with eased energy).

### Sound (`console-sound.ts`)
WebAudio synth singleton, gated behind the existing `SoundToggle` (ambient.mp3 unchanged — the toggle click is the gesture that unlocks the AudioContext). Key clacks while typing (rate-capped by `clackGapS`, ≤12/s), laser `zap()` on portal-hover rising edge. No-ops without WebAudio (SSR/tests). CRT hum deliberately skipped — the ambient track fills that role.

### Devtools egg (`console-egg.ts`)
ASCII CRT + greeting printed once on home mount (guarded against StrictMode double-mounts), registers `window.hire()` → PERMISSION GRANTED + email.

## Key Files

| File | Role |
|------|------|
| `app/components/hero-scene.client.tsx` | Scene + CrtOs frame loop, all canvas mode drawing, floor/motes/env/lasers |
| `app/lib/crt-modes.ts` | Mode type, click cycle, saver rules |
| `app/lib/crt-terminal.ts` | Interactive prompt state machine + command interpreter |
| `app/lib/crt-script.ts` | Attract scripts (day + late-night) + typing machine |
| `app/lib/boot-sequence.ts` | Power-on raster/memcheck + power-off collapse (pure time functions) |
| `app/lib/matrix-rain.ts` / `pong.ts` / `starfield.ts` / `dvd-bounce.ts` | Toy-mode state machines (pure, rng-injected) |
| `app/lib/console-sound.ts` | WebAudio clack/zap synth behind the sound toggle |
| `app/lib/console-egg.ts` | Devtools ASCII art + `hire()` |
| `app/routes/home.tsx` | Console-egg mount effect |
| `app/components/sound-toggle.tsx` | Now also flips `setSoundEnabled` for the synth SFX |

## Testability
- 70 new unit tests across 9 lib test files (`crt-modes`, `matrix-rain`, `pong`, `starfield`, `dvd-bounce`, `crt-terminal`, `boot-sequence`, `console-egg`, `console-sound`, `crt-script` additions) — 365 total green.
- Browser walk 2026-07-22 (live dev server, Playwright): see `verifications/2026-07-22.md` + `screenshots/`.
- Keyboard capture skips INPUT/TEXTAREA/SELECT/contentEditable and modifier combos; page has no other key handlers.

## Dependencies
- Existing three/R3F/drei only — **no new packages**. Postprocessing bloom evaluated and rejected (new dep + EffectComposer context-loss risk vs. brain WebGL stability rules; canvas shadowBlur already provides the glow).

## Tagged Errors
None (client-only, no data path).

## Changelog

| Date | Type | Description |
|------|------|-------------|
| 2026-07-22 | feature | Shipped — sleek pass + interactive OS + eggs. verify-done PASS (typecheck, 365 tests, e2e 2/2, build). Browser walk PASS with 17 screenshots. Konami excluded per user. |
