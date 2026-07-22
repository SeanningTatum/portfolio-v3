import { describe, it, expect } from "vitest";
import {
  clack,
  clackGapS,
  isSoundEnabled,
  setSoundEnabled,
  zap,
} from "../console-sound";

describe("clackGapS", () => {
  it("matches the typing rate at human speeds", () => {
    expect(clackGapS(10)).toBeCloseTo(0.1);
  });

  it("caps at 12 clacks per second for machine-gun typing", () => {
    expect(clackGapS(46)).toBeCloseTo(1 / 12);
  });

  it("never exceeds one second at crawling speeds", () => {
    expect(clackGapS(0.2)).toBeCloseTo(1);
  });
});

describe("sound switch", () => {
  it("toggles and reports state", () => {
    setSoundEnabled(true);
    expect(isSoundEnabled()).toBe(true);
    setSoundEnabled(false);
    expect(isSoundEnabled()).toBe(false);
  });

  it("clack/zap are safe no-ops without WebAudio (SSR/test env)", () => {
    setSoundEnabled(true);
    expect(() => {
      clack();
      zap();
    }).not.toThrow();
    setSoundEnabled(false);
  });
});
