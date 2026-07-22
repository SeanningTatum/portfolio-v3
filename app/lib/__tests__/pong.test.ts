import { describe, it, expect } from "vitest";
import { PADDLE_H, initPong, stepPong } from "../pong";

describe("stepPong", () => {
  it("moves the ball by velocity * dt", () => {
    const s = initPong();
    const next = stepPong(s, 0.1);
    expect(next.ballX).toBeCloseTo(s.ballX + s.vx * 0.1);
    expect(next.ballY).toBeCloseTo(s.ballY + s.vy * 0.1);
  });

  it("bounces off the bottom wall", () => {
    const s = { ...initPong(), ballY: 0.98, vy: 0.5 };
    const next = stepPong(s, 0.1);
    expect(next.ballY).toBeLessThanOrEqual(1);
    expect(next.vy).toBeLessThan(0);
  });

  it("bounces off the top wall", () => {
    const s = { ...initPong(), ballY: 0.02, vy: -0.5 };
    const next = stepPong(s, 0.1);
    expect(next.ballY).toBeGreaterThanOrEqual(0);
    expect(next.vy).toBeGreaterThan(0);
  });

  it("paddles chase the ball with capped speed", () => {
    const s = { ...initPong(), ballY: 0.9, leftY: 0.1, rightY: 0.1 };
    const next = stepPong(s, 0.1);
    // Cap: PADDLE_SPEED (0.42) * 0.1 — far less than the 0.8 gap.
    expect(next.leftY).toBeGreaterThan(0.1);
    expect(next.leftY).toBeLessThan(0.2);
  });

  it("paddles never leave the field", () => {
    let s = { ...initPong(), ballY: 0.0, vy: 0 };
    for (let i = 0; i < 100; i++) s = stepPong(s, 0.05);
    expect(s.leftY).toBeGreaterThanOrEqual(PADDLE_H / 2);
    expect(s.rightY).toBeGreaterThanOrEqual(PADDLE_H / 2);
  });

  it("reflects off a paddle that made it in time", () => {
    const s = { ...initPong(), ballX: 0.05, ballY: 0.5, vx: -0.55, leftY: 0.5 };
    const next = stepPong(s, 0.05);
    expect(next.vx).toBeGreaterThan(0);
  });

  it("scores when a paddle misses and serves toward the scorer", () => {
    // Park the left paddle far away and freeze vertical motion so the chase
    // can't save it.
    let s = {
      ...initPong(),
      ballX: 0.05,
      ballY: 0.08,
      vy: 0,
      vx: -0.55,
      leftY: 0.9,
      rightY: 0.9,
    };
    let scored = false;
    for (let i = 0; i < 60; i++) {
      s = stepPong(s, 0.03);
      if (s.scoreR === 1) {
        scored = true;
        break;
      }
      // keep the paddle pinned away from the ball
      s = { ...s, leftY: 0.9, ballY: 0.08, vy: 0 };
    }
    expect(scored).toBe(true);
    expect(s.ballX).toBeCloseTo(0.5);
    expect(s.vx).toBeLessThan(0);
  });

  it("keeps rallies alive long-term without NaNs", () => {
    let s = initPong();
    for (let i = 0; i < 2000; i++) s = stepPong(s, 1 / 60);
    expect(Number.isFinite(s.ballX)).toBe(true);
    expect(Number.isFinite(s.ballY)).toBe(true);
    expect(Number.isFinite(s.vy)).toBe(true);
  });
});
