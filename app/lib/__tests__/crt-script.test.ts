import { describe, it, expect } from "vitest";
import {
  advanceType,
  isComplete,
  visibleLines,
  INITIAL_TYPE_STATE,
} from "../crt-script";

const SCRIPT = ["abc", "de", "f"] as const;

describe("advanceType", () => {
  it("advances within a line", () => {
    expect(advanceType(INITIAL_TYPE_STATE, 2, SCRIPT)).toEqual({
      line: 0,
      char: 2,
    });
  });

  it("flows across line boundaries", () => {
    expect(advanceType(INITIAL_TYPE_STATE, 4, SCRIPT)).toEqual({
      line: 1,
      char: 1,
    });
  });

  it("completes exactly at the end", () => {
    const done = advanceType(INITIAL_TYPE_STATE, 6, SCRIPT);
    expect(done).toEqual({ line: 3, char: 0 });
    expect(isComplete(done, SCRIPT)).toBe(true);
  });

  it("stays put once complete", () => {
    const done = advanceType(INITIAL_TYPE_STATE, 100, SCRIPT);
    expect(advanceType(done, 10, SCRIPT)).toEqual(done);
  });

  it("ignores zero and negative chars", () => {
    expect(advanceType({ line: 1, char: 1 }, 0, SCRIPT)).toEqual({
      line: 1,
      char: 1,
    });
    expect(advanceType({ line: 1, char: 1 }, -5, SCRIPT)).toEqual({
      line: 1,
      char: 1,
    });
  });
});

describe("visibleLines", () => {
  it("shows fully typed lines plus the partial current line", () => {
    expect(visibleLines({ line: 1, char: 1 }, 10, SCRIPT)).toEqual([
      "abc",
      "d",
    ]);
  });

  it("omits the current line when nothing of it is typed", () => {
    expect(visibleLines({ line: 1, char: 0 }, 10, SCRIPT)).toEqual(["abc"]);
  });

  it("scrolls to the last maxRows rows", () => {
    const done = advanceType(INITIAL_TYPE_STATE, 100, SCRIPT);
    expect(visibleLines(done, 2, SCRIPT)).toEqual(["de", "f"]);
  });

  it("returns everything when complete and maxRows is large", () => {
    const done = advanceType(INITIAL_TYPE_STATE, 100, SCRIPT);
    expect(visibleLines(done, 10, SCRIPT)).toEqual(["abc", "de", "f"]);
  });
});
