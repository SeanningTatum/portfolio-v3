import { describe, it, expect } from "vitest";
import { initMatrix, matrixGlyph, stepMatrix } from "../matrix-rain";

const half = () => 0.5;

describe("initMatrix", () => {
  it("creates one stream per column inside the screen", () => {
    const s = initMatrix(8, 20, half);
    expect(s.cols).toHaveLength(8);
    for (const c of s.cols) {
      expect(c.y).toBeGreaterThanOrEqual(0);
      expect(c.y).toBeLessThanOrEqual(20);
      expect(c.speed).toBeGreaterThan(0);
      expect(c.len).toBeGreaterThan(0);
    }
  });
});

describe("stepMatrix", () => {
  it("advances heads by speed * dt", () => {
    const s = initMatrix(2, 20, half);
    const next = stepMatrix(s, 0.5, half);
    expect(next.cols[0].y).toBeCloseTo(s.cols[0].y + s.cols[0].speed * 0.5);
  });

  it("respawns a stream above the screen once its tail exits", () => {
    const s = initMatrix(1, 10, half);
    // Push far past the bottom in one giant step.
    const next = stepMatrix(s, 1000, half);
    expect(next.cols[0].y).toBeLessThanOrEqual(0);
  });

  it("does not mutate the input state", () => {
    const s = initMatrix(2, 20, half);
    const y = s.cols[0].y;
    stepMatrix(s, 1, half);
    expect(s.cols[0].y).toBe(y);
  });
});

describe("matrixGlyph", () => {
  it("is deterministic for the same cell and tick", () => {
    expect(matrixGlyph(3, 7, 42)).toBe(matrixGlyph(3, 7, 42));
  });

  it("changes with the tick (shimmer)", () => {
    const glyphs = new Set(
      Array.from({ length: 20 }, (_, t) => matrixGlyph(3, 7, t))
    );
    expect(glyphs.size).toBeGreaterThan(1);
  });

  it("always returns a single character", () => {
    for (let c = 0; c < 5; c++)
      for (let r = 0; r < 5; r++) expect(matrixGlyph(c, r, 1)).toHaveLength(1);
  });
});
