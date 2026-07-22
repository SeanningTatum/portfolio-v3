import { describe, it, expect } from "vitest";
import {
  BOOT_LINES,
  BOOT_TOTAL_S,
  OFF_TOTAL_S,
  bootFrame,
  offFrame,
} from "../boot-sequence";

describe("bootFrame", () => {
  it("starts as a collapsed raster that expands", () => {
    const start = bootFrame(0);
    expect(start.phase).toBe("raster");
    expect(start.expand).toBe(0);
    const mid = bootFrame(0.3);
    expect(mid.expand).toBeGreaterThan(0);
    expect(mid.expand).toBeLessThanOrEqual(1);
  });

  it("types memcheck lines progressively", () => {
    const early = bootFrame(0.6);
    expect(early.phase).toBe("memcheck");
    expect(early.lines.length).toBeGreaterThanOrEqual(1);
    const later = bootFrame(BOOT_TOTAL_S - 0.51);
    expect(later.lines.length).toBeGreaterThan(early.lines.length);
    expect(later.lines.length).toBeLessThanOrEqual(BOOT_LINES.length);
  });

  it("finishes with every line shown", () => {
    const done = bootFrame(BOOT_TOTAL_S + 1);
    expect(done.phase).toBe("done");
    expect(done.lines).toEqual([...BOOT_LINES]);
    expect(done.expand).toBe(1);
  });

  it("expansion is monotonic", () => {
    let prev = -1;
    for (let t = 0; t <= 0.55; t += 0.05) {
      const { expand } = bootFrame(t);
      expect(expand).toBeGreaterThanOrEqual(prev);
      prev = expand;
    }
  });
});

describe("offFrame", () => {
  it("collapses the raster first", () => {
    const f = offFrame(0.1);
    expect(f.collapse).toBeLessThan(1);
    expect(f.collapse).toBeGreaterThan(0);
    expect(f.width).toBe(1);
    expect(f.done).toBe(false);
  });

  it("then shrinks the line", () => {
    const f = offFrame(0.35);
    expect(f.collapse).toBe(0);
    expect(f.width).toBeLessThan(1);
    expect(f.glow).toBe(1);
  });

  it("then fades the dot and completes", () => {
    const fading = offFrame(OFF_TOTAL_S - 0.1);
    expect(fading.glow).toBeLessThan(1);
    expect(fading.done).toBe(false);
    const done = offFrame(OFF_TOTAL_S + 0.1);
    expect(done.done).toBe(true);
    expect(done.glow).toBe(0);
  });
});
