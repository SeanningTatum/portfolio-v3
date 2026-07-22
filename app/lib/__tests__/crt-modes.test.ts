import { describe, it, expect } from "vitest";
import {
  CLICK_CYCLE,
  IDLE_TO_SAVER_S,
  canEnterSaver,
  nextMode,
} from "../crt-modes";

describe("nextMode", () => {
  it("cycles through the click order", () => {
    expect(nextMode("terminal")).toBe("matrix");
    expect(nextMode("matrix")).toBe("pong");
    expect(nextMode("pong")).toBe("starfield");
    expect(nextMode("starfield")).toBe("terminal");
  });

  it("wakes the screensaver back to the terminal", () => {
    expect(nextMode("saver")).toBe("terminal");
  });

  it("ignores clicks while off or booting", () => {
    expect(nextMode("off")).toBe("off");
    expect(nextMode("boot")).toBe("boot");
  });

  it("cycle only contains interactive display modes", () => {
    expect(CLICK_CYCLE).not.toContain("off");
    expect(CLICK_CYCLE).not.toContain("boot");
    expect(CLICK_CYCLE).not.toContain("saver");
  });
});

describe("canEnterSaver", () => {
  it("allows saver from display modes", () => {
    expect(canEnterSaver("terminal")).toBe(true);
    expect(canEnterSaver("pong")).toBe(true);
  });

  it("blocks saver from off, boot and itself", () => {
    expect(canEnterSaver("off")).toBe(false);
    expect(canEnterSaver("boot")).toBe(false);
    expect(canEnterSaver("saver")).toBe(false);
  });

  it("idle threshold is a sane positive number", () => {
    expect(IDLE_TO_SAVER_S).toBeGreaterThan(10);
  });
});
