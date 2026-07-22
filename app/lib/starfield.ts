/**
 * Fly-through starfield for the CRT screen. Stars live in normalized space
 * (x, y ∈ -1..1 around center, z ∈ 0..1 depth) and rush toward the viewer;
 * projection to pixels happens in `projectStar`. Pure — callers inject rng.
 */

export interface Star {
  x: number;
  y: number;
  z: number;
}

export interface StarfieldState {
  stars: Star[];
}

const SPEED = 0.35; // depth units per second
const NEAR = 0.06; // respawn once closer than this

function spawn(rng: () => number, z: number): Star {
  return { x: rng() * 2 - 1, y: rng() * 2 - 1, z };
}

export function initStarfield(count: number, rng: () => number): StarfieldState {
  return {
    stars: Array.from({ length: count }, () => spawn(rng, NEAR + rng() * (1 - NEAR))),
  };
}

export function stepStarfield(
  state: StarfieldState,
  dt: number,
  rng: () => number
): StarfieldState {
  return {
    stars: state.stars.map((s) => {
      const z = s.z - SPEED * dt;
      return z <= NEAR ? spawn(rng, 1) : { ...s, z };
    }),
  };
}

/**
 * Perspective-project a star onto a w×h screen. Nearer stars sit further
 * from center, draw bigger, and shine brighter.
 */
export function projectStar(
  star: Star,
  w: number,
  h: number
): { x: number; y: number; size: number; bright: number } {
  const p = 1 / star.z;
  return {
    x: w / 2 + star.x * p * (w / 4),
    y: h / 2 + star.y * p * (h / 4),
    size: Math.min(5, 1.1 * p),
    bright: Math.min(1, 0.42 * p),
  };
}
