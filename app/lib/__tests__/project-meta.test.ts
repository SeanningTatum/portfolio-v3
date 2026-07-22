import { describe, it, expect } from "vitest";
import { getProjectMeta } from "../project-meta";

describe("getProjectMeta", () => {
  it("returns year, first stack entry, and role in order", () => {
    expect(
      getProjectMeta({ year: 2026, stack: ["react-router", "trpc"], role: "Solo builder" })
    ).toEqual(["2026", "react-router", "Solo builder"]);
  });

  it("caps the result at 3 tokens even if inputs somehow exceed it", () => {
    const meta = getProjectMeta({
      year: 2025,
      stack: ["a", "b", "c"],
      role: "Author",
    });
    expect(meta).toHaveLength(3);
  });

  it("drops an empty stack entry instead of emitting an empty token", () => {
    expect(getProjectMeta({ year: 2024, stack: [], role: "Maintainer" })).toEqual([
      "2024",
      "Maintainer",
    ]);
  });

  it("stringifies the year", () => {
    expect(getProjectMeta({ year: 2020, stack: ["x"], role: "R" })[0]).toBe("2020");
  });
});
