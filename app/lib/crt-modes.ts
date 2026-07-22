/**
 * Screen-mode state for the CRT (`hero-scene.client.tsx`). The tube is a
 * tiny operating system: an attract-mode terminal by default, cycling
 * through toy modes on click, a screensaver when idle, and off via the
 * power LED. Pure — no three.js/canvas — see `__tests__/crt-modes.test.ts`.
 */

export type ScreenMode =
  | "boot" // power-on sequence (raster expand + memcheck)
  | "terminal" // attract script or interactive prompt
  | "matrix" // matrix rain
  | "pong" // self-playing pong
  | "starfield" // flying through stars
  | "saver" // idle screensaver (DVD bounce)
  | "off"; // tube dark, LED dim

/** Click order on the tube. Other modes don't participate in the cycle. */
export const CLICK_CYCLE: readonly ScreenMode[] = [
  "terminal",
  "matrix",
  "pong",
  "starfield",
];

/** Seconds of no pointer/keyboard input before the screensaver kicks in. */
export const IDLE_TO_SAVER_S = 60;

/**
 * The mode a click on the tube transitions to. Cycle modes advance;
 * the screensaver wakes back to the terminal; boot and off ignore clicks
 * (off is exclusively the power LED's business).
 */
export function nextMode(mode: ScreenMode): ScreenMode {
  const i = CLICK_CYCLE.indexOf(mode);
  if (i !== -1) return CLICK_CYCLE[(i + 1) % CLICK_CYCLE.length];
  if (mode === "saver") return "terminal";
  return mode;
}

/** Modes the idle screensaver may interrupt. */
export function canEnterSaver(mode: ScreenMode): boolean {
  return mode !== "off" && mode !== "boot" && mode !== "saver";
}
