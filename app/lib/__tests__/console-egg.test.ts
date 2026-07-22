import { describe, it, expect } from "vitest";
import {
  CONSOLE_ART,
  CONSOLE_GREETING,
  HIRE_MESSAGE,
  printConsoleEgg,
} from "../console-egg";

describe("console egg strings", () => {
  it("art draws the CRT and its label", () => {
    expect(CONSOLE_ART).toContain("OBJECT_02 — CRT");
    expect(CONSOLE_ART).toContain("whoami");
  });

  it("greeting and hire message carry the contact address", () => {
    expect(CONSOLE_GREETING).toContain("sean@casperstudios.xyz");
    expect(HIRE_MESSAGE).toContain("sean@casperstudios.xyz");
  });
});

describe("printConsoleEgg", () => {
  it("prints once and registers hire()", () => {
    const logs: unknown[][] = [];
    const con = { log: (...args: unknown[]) => logs.push(args) };
    const target: Record<string, unknown> = {};
    printConsoleEgg(con, target);
    expect(logs).toHaveLength(1);
    expect(typeof target.hire).toBe("function");
  });

  it("is idempotent (StrictMode double-mount safe)", () => {
    const logs: unknown[][] = [];
    const con = { log: (...args: unknown[]) => logs.push(args) };
    const target: Record<string, unknown> = {};
    printConsoleEgg(con, target);
    printConsoleEgg(con, target);
    expect(logs).toHaveLength(1);
  });

  it("hire() logs the granted message and returns the address", () => {
    const logs: unknown[][] = [];
    const con = { log: (...args: unknown[]) => logs.push(args) };
    const target: Record<string, unknown> = {};
    printConsoleEgg(con, target);
    const result = (target.hire as () => string)();
    expect(result).toBe("sean@casperstudios.xyz");
    expect(logs.length).toBe(2);
  });
});
