import { describe, it, expect } from "vitest";
import { initStarfield, projectStar, stepStarfield } from "../starfield";

const half = () => 0.5;

describe("initStarfield", () => {
  it("spawns the requested number of stars in bounds", () => {
    const s = initStarfield(30, half);
    expect(s.stars).toHaveLength(30);
    for (const star of s.stars) {
      expect(star.z).toBeGreaterThan(0);
      expect(star.z).toBeLessThanOrEqual(1);
      expect(Math.abs(star.x)).toBeLessThanOrEqual(1);
    }
  });
});

describe("stepStarfield", () => {
  it("moves stars toward the viewer", () => {
    const s = initStarfield(5, half);
    const next = stepStarfield(s, 0.1, half);
    expect(next.stars[0].z).toBeLessThan(s.stars[0].z);
  });

  it("respawns stars at the far plane when they pass the camera", () => {
    const s = initStarfield(5, half);
    const next = stepStarfield(s, 100, half);
    for (const star of next.stars) expect(star.z).toBe(1);
  });
});

describe("projectStar", () => {
  it("centers a star at x=0,y=0", () => {
    const p = projectStar({ x: 0, y: 0, z: 0.5 }, 512, 384);
    expect(p.x).toBe(256);
    expect(p.y).toBe(192);
  });

  it("near stars are bigger and brighter than far stars", () => {
    const near = projectStar({ x: 0.5, y: 0.5, z: 0.1 }, 512, 384);
    const far = projectStar({ x: 0.5, y: 0.5, z: 0.9 }, 512, 384);
    expect(near.size).toBeGreaterThan(far.size);
    expect(near.bright).toBeGreaterThan(far.bright);
  });

  it("clamps size and brightness", () => {
    const p = projectStar({ x: 0, y: 0, z: 0.0001 }, 512, 384);
    expect(p.size).toBeLessThanOrEqual(5);
    expect(p.bright).toBeLessThanOrEqual(1);
  });
});
