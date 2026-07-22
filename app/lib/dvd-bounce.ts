/**
 * DVD-logo screensaver physics for the CRT idle mode. The logo drifts in a
 * normalized 1×1 box and bounces off the walls; hitting a corner (both axes
 * flip in the same step) increments the sacred counter. Pure, no rng.
 */

export interface DvdState {
  /** Top-left corner of the logo, normalized. */
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Wall bounces since init. */
  hits: number;
  /** Exact corner hits since init — the thing people wait for. */
  cornerHits: number;
}

const SPEED_X = 0.16;
const SPEED_Y = 0.11;

export function initDvd(): DvdState {
  return { x: 0.1, y: 0.2, vx: SPEED_X, vy: SPEED_Y, hits: 0, cornerHits: 0 };
}

/**
 * Advance the logo; `logoW`/`logoH` are the logo's size in box units so the
 * bounce happens on its far edge, not its origin.
 */
export function stepDvd(
  s: DvdState,
  dt: number,
  logoW: number,
  logoH: number
): DvdState {
  let { x, y, vx, vy, hits, cornerHits } = s;
  x += vx * dt;
  y += vy * dt;

  const maxX = 1 - logoW;
  const maxY = 1 - logoH;
  let bounced = 0;

  if (x < 0) {
    x = -x;
    vx = Math.abs(vx);
    bounced += 1;
  } else if (x > maxX) {
    x = 2 * maxX - x;
    vx = -Math.abs(vx);
    bounced += 1;
  }
  if (y < 0) {
    y = -y;
    vy = Math.abs(vy);
    bounced += 1;
  } else if (y > maxY) {
    y = 2 * maxY - y;
    vy = -Math.abs(vy);
    bounced += 1;
  }

  if (bounced > 0) hits += 1;
  if (bounced === 2) cornerHits += 1;
  return { x, y, vx, vy, hits, cornerHits };
}
