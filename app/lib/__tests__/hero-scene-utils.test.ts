import { describe, it, expect } from "vitest";
import { approach, clamp, parallaxTarget, spinSpeed } from "../hero-scene-utils";

describe("clamp", () => {
  it("returns the value when inside the range", () => {
    expect(clamp(0.5, -1, 1)).toBe(0.5);
  });

  it("clamps below the minimum", () => {
    expect(clamp(-3, -1, 1)).toBe(-1);
  });

  it("clamps above the maximum", () => {
    expect(clamp(7, -1, 1)).toBe(1);
  });
});

describe("parallaxTarget", () => {
  it("is zero at pointer center", () => {
    expect(parallaxTarget(0, 0)).toEqual({ rotX: -0, rotY: 0 });
  });

  it("yaws toward the pointer and tilts opposite the vertical axis", () => {
    const { rotX, rotY } = parallaxTarget(1, 1, 0.22);
    expect(rotY).toBeCloseTo(0.22); // pointer right → yaw right
    expect(rotX).toBeCloseTo(-0.22); // pointer up → tilt back
  });

  it("scales with intensity", () => {
    expect(parallaxTarget(0.5, 0, 0.4).rotY).toBeCloseTo(0.2);
  });

  it("clamps out-of-range pointer values", () => {
    const { rotX, rotY } = parallaxTarget(50, -50, 0.22);
    expect(rotY).toBeCloseTo(0.22);
    expect(rotX).toBeCloseTo(0.22);
  });
});

describe("approach", () => {
  it("moves current toward target without overshooting", () => {
    const next = approach(0, 1, 1 / 60, 4);
    expect(next).toBeGreaterThan(0);
    expect(next).toBeLessThan(1);
  });

  it("is an identity when already at the target", () => {
    expect(approach(0.3, 0.3, 1 / 60)).toBeCloseTo(0.3);
  });

  it("closes more of the gap with a larger delta", () => {
    const slow = approach(0, 1, 1 / 120, 4);
    const fast = approach(0, 1, 1 / 30, 4);
    expect(fast).toBeGreaterThan(slow);
  });

  it("clamps delta so a refocused tab eases instead of snapping", () => {
    const clamped = approach(0, 1, 5, 4); // 5s frame gap
    const atCap = approach(0, 1, 0.1, 4);
    expect(clamped).toBeCloseTo(atCap);
    expect(clamped).toBeLessThan(1);
  });

  it("works approaching from above", () => {
    const next = approach(1, 0, 1 / 60, 4);
    expect(next).toBeLessThan(1);
    expect(next).toBeGreaterThan(0);
  });
});

describe("spinSpeed", () => {
  it("returns the idle speed at zero energy", () => {
    expect(spinSpeed(0)).toBeCloseTo(0.25);
  });

  it("returns the excited speed at full energy", () => {
    expect(spinSpeed(1)).toBeCloseTo(1.1);
  });

  it("interpolates linearly between idle and excited", () => {
    expect(spinSpeed(0.5)).toBeCloseTo((0.25 + 1.1) / 2);
  });

  it("clamps energy outside [0, 1]", () => {
    expect(spinSpeed(-2)).toBeCloseTo(0.25);
    expect(spinSpeed(5)).toBeCloseTo(1.1);
  });

  it("honors custom idle/excited speeds", () => {
    expect(spinSpeed(1, 0.1, 2)).toBeCloseTo(2);
  });
});
