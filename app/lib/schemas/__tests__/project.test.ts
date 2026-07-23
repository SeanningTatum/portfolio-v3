import { describe, it, expect } from "vitest";
import { Schema } from "effect";
import { ProjectContent } from "../project";

const decode = <A, I>(s: Schema.Schema<A, I>) => Schema.decodeUnknownEither(s);

const base = {
  slug: "portfolio-v3",
  title: "portfolio-v3",
  summary: "This site.",
  category: "saas",
  year: 2026,
  stack: ["react-router", "d1"],
  role: "Solo builder",
  featured: true,
  sortOrder: 0,
};

describe("ProjectContent", () => {
  it("decodes a minimal project (no case-study fields)", () => {
    expect(decode(ProjectContent)(base)._tag).toBe("Right");
  });

  it("decodes a full project with case-study fields + stats", () => {
    expect(
      decode(ProjectContent)({
        ...base,
        client: "Personal",
        heroImageUrl: null,
        why: "why text",
        how: "how text",
        solution: "solution text",
        stats: [{ label: "Unit tests", value: "234+" }],
      })._tag
    ).toBe("Right");
  });

  it("rejects a missing required field (title)", () => {
    const { title, ...withoutTitle } = base;
    expect(decode(ProjectContent)(withoutTitle)._tag).toBe("Left");
  });

  it("rejects a non-numeric year", () => {
    expect(decode(ProjectContent)({ ...base, year: "2026" })._tag).toBe("Left");
  });

  it("rejects a non-array stack", () => {
    expect(decode(ProjectContent)({ ...base, stack: "d1" })._tag).toBe("Left");
  });

  it("rejects a malformed stat (missing value)", () => {
    expect(
      decode(ProjectContent)({
        ...base,
        stats: [{ label: "Unit tests" }],
      })._tag
    ).toBe("Left");
  });
});
