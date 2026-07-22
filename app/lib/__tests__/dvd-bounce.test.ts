import { describe, it, expect } from "vitest";
import { initDvd, stepDvd } from "../dvd-bounce";

const W = 0.2;
const H = 0.1;

describe("stepDvd", () => {
  it("drifts by velocity * dt", () => {
    const s = initDvd();
    const next = stepDvd(s, 0.5, W, H);
    expect(next.x).toBeCloseTo(s.x + s.vx * 0.5);
    expect(next.y).toBeCloseTo(s.y + s.vy * 0.5);
  });

  it("bounces off the right wall using the logo's far edge", () => {
    const s = { ...initDvd(), x: 1 - W - 0.001, vx: 0.16 };
    const next = stepDvd(s, 0.2, W, H);
    expect(next.x).toBeLessThanOrEqual(1 - W);
    expect(next.vx).toBeLessThan(0);
    expect(next.hits).toBe(1);
  });

  it("bounces off the left wall", () => {
    const s = { ...initDvd(), x: 0.001, vx: -0.16 };
    const next = stepDvd(s, 0.2, W, H);
    expect(next.x).toBeGreaterThanOrEqual(0);
    expect(next.vx).toBeGreaterThan(0);
  });

  it("counts a corner hit when both axes flip in one step", () => {
    const s = { ...initDvd(), x: 1 - W - 0.001, y: 1 - H - 0.001, vx: 0.16, vy: 0.11 };
    const next = stepDvd(s, 0.3, W, H);
    expect(next.cornerHits).toBe(1);
  });

  it("stays in bounds over a long run", () => {
    let s = initDvd();
    for (let i = 0; i < 5000; i++) s = stepDvd(s, 1 / 30, W, H);
    expect(s.x).toBeGreaterThanOrEqual(0);
    expect(s.x).toBeLessThanOrEqual(1 - W);
    expect(s.y).toBeGreaterThanOrEqual(0);
    expect(s.y).toBeLessThanOrEqual(1 - H);
    expect(s.hits).toBeGreaterThan(0);
  });
});
