/**
 * Pure math helpers for the home 3D hero scene (`hero-scene.client.tsx`).
 * Kept free of three.js imports so they stay unit-testable in plain Vitest
 * (no WebGL / jsdom needed) — see `__tests__/hero-scene-utils.test.ts`.
 */

/** Clamp `value` into the inclusive range [min, max]. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export interface ParallaxTarget {
  /** Target rotation around the X axis, radians. */
  rotX: number;
  /** Target rotation around the Y axis, radians. */
  rotY: number;
}

/**
 * Map normalized pointer coordinates (R3F `state.pointer`, each in [-1, 1])
 * to a subtle parallax rotation target. Pointer right → object yaws right;
 * pointer up → object tilts back. Inputs outside [-1, 1] are clamped so a
 * stale pointer can never fling the object.
 */
export function parallaxTarget(
  pointerX: number,
  pointerY: number,
  intensity = 0.22
): ParallaxTarget {
  return {
    rotX: clamp(-pointerY, -1, 1) * intensity,
    rotY: clamp(pointerX, -1, 1) * intensity,
  };
}

/**
 * Frame-rate-independent exponential approach of `current` toward `target`
 * (classic damping: closes ~`1 - e^(-speed·delta)` of the gap per frame).
 * `delta` is clamped to 100ms so a backgrounded tab regaining focus eases
 * back in instead of snapping.
 */
export function approach(
  current: number,
  target: number,
  delta: number,
  speed = 4
): number {
  const dt = clamp(delta, 0, 0.1);
  return current + (target - current) * (1 - Math.exp(-speed * dt));
}

/**
 * Spin speed for the hero object given the eased "energy" level (0 = idle,
 * 1 = a portal CTA is hovered). Idle keeps the slow desktop.fm drift; full
 * energy roughly quadruples it. Energy outside [0, 1] is clamped.
 */
export function spinSpeed(
  energy: number,
  idle = 0.25,
  excited = 1.1
): number {
  return idle + (excited - idle) * clamp(energy, 0, 1);
}
