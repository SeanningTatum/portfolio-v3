/**
 * CRT power-on sequence — the classic tube ritual: a bright horizontal
 * line snaps on and expands into the full raster, then a BIOS memcheck
 * types out before the OS (attract terminal) takes over. Pure function of
 * elapsed time so it's trivially testable and seek-safe.
 */

export interface BootFrame {
  phase: "raster" | "memcheck" | "done";
  /** 0..1 — vertical fraction of the raster that is lit (raster phase). */
  expand: number;
  /** Fully visible memcheck lines (memcheck phase). */
  lines: string[];
}

const RASTER_S = 0.55;
const LINE_INTERVAL_S = 0.38;

export const BOOT_LINES: readonly string[] = [
  "URGEL BIOS v3.0",
  "MEM CHECK ... 640K OK",
  "PHOSPHOR ... GREEN",
  "AGENTS ... READY",
  "BOOT OK",
];

export const BOOT_TOTAL_S = RASTER_S + BOOT_LINES.length * LINE_INTERVAL_S + 0.5;

export function bootFrame(t: number): BootFrame {
  if (t < RASTER_S) {
    // Ease-out — the raster blooms fast then settles.
    const u = Math.max(0, t / RASTER_S);
    return { phase: "raster", expand: 1 - (1 - u) * (1 - u), lines: [] };
  }
  if (t < BOOT_TOTAL_S) {
    const shown = Math.min(
      BOOT_LINES.length,
      Math.floor((t - RASTER_S) / LINE_INTERVAL_S) + 1
    );
    return { phase: "memcheck", expand: 1, lines: BOOT_LINES.slice(0, shown) };
  }
  return { phase: "done", expand: 1, lines: [...BOOT_LINES] };
}

/**
 * Power-OFF collapse — the inverse ritual: raster collapses to a bright
 * line, the line shrinks to a dot, the dot fades. Returns the visual state
 * for elapsed time since power-off.
 */
export interface OffFrame {
  /** 0..1 — remaining vertical raster (1 = full picture, 0 = flat line). */
  collapse: number;
  /** 0..1 — remaining horizontal extent of the line/dot. */
  width: number;
  /** 0..1 — brightness of what's left. */
  glow: number;
  done: boolean;
}

const COLLAPSE_S = 0.22;
const SHRINK_S = 0.3;
const FADE_S = 0.5;
export const OFF_TOTAL_S = COLLAPSE_S + SHRINK_S + FADE_S;

export function offFrame(t: number): OffFrame {
  if (t < COLLAPSE_S) {
    return { collapse: 1 - t / COLLAPSE_S, width: 1, glow: 1, done: false };
  }
  if (t < COLLAPSE_S + SHRINK_S) {
    const u = (t - COLLAPSE_S) / SHRINK_S;
    return { collapse: 0, width: 1 - u * 0.96, glow: 1, done: false };
  }
  if (t < OFF_TOTAL_S) {
    const u = (t - COLLAPSE_S - SHRINK_S) / FADE_S;
    return { collapse: 0, width: 0.04, glow: 1 - u, done: false };
  }
  return { collapse: 0, width: 0, glow: 0, done: true };
}
