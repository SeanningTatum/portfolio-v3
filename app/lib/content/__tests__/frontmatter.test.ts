import { describe, it, expect } from "vitest";
import { parseFrontmatter, parseSections } from "../frontmatter";

describe("parseFrontmatter", () => {
  it("parses scalars, numbers, booleans and JSON arrays", () => {
    const raw = [
      "---",
      "slug: portfolio-v3",
      "title: portfolio-v3",
      "summary: This site — a real backend.",
      "year: 2026",
      "featured: true",
      'stack: ["react-router", "d1"]',
      "sortOrder: 0",
      "---",
      "",
      "## WHY",
      "because",
      "",
    ].join("\n");

    const result = parseFrontmatter(raw);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.data).toEqual({
        slug: "portfolio-v3",
        title: "portfolio-v3",
        summary: "This site — a real backend.",
        year: 2026,
        featured: true,
        stack: ["react-router", "d1"],
        sortOrder: 0,
      });
      expect(result.value.body).toContain("## WHY");
      expect(result.value.body).toContain("because");
    }
  });

  it("parses a JSON array of objects (stats)", () => {
    const raw = [
      "---",
      'stats: [{ "label": "Unit tests", "value": "234+" }]',
      "---",
    ].join("\n");
    const result = parseFrontmatter(raw);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.data.stats).toEqual([
        { label: "Unit tests", value: "234+" },
      ]);
    }
  });

  it("keeps a value's colons intact (splits on the first colon only)", () => {
    const result = parseFrontmatter(["---", "summary: a: b: c", "---"].join("\n"));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.data.summary).toBe("a: b: c");
  });

  it("fails when there is no frontmatter fence", () => {
    const result = parseFrontmatter("no frontmatter here\n## WHY\nx");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/frontmatter/i);
  });

  it("fails on a block line without a colon", () => {
    const result = parseFrontmatter(["---", "not a key value", "---"].join("\n"));
    expect(result.ok).toBe(false);
  });
});

describe("parseSections", () => {
  const body = [
    "## WHY",
    "why line one",
    "",
    "why line two",
    "",
    "## HOW",
    "how text",
    "",
    "## SOLUTION",
    "solution text",
  ].join("\n");

  it("extracts each section keyed by lowercased heading", () => {
    const sections = parseSections(body);
    expect(sections.why).toBe("why line one\n\nwhy line two");
    expect(sections.how).toBe("how text");
    expect(sections.solution).toBe("solution text");
  });

  it("omits a section that is absent", () => {
    const sections = parseSections("## WHY\nonly why");
    expect(sections.why).toBe("only why");
    expect(sections.solution).toBeUndefined();
  });

  it("drops a heading with no text under it", () => {
    const sections = parseSections("## WHY\n\n## HOW\nhas text");
    expect(sections.why).toBeUndefined();
    expect(sections.how).toBe("has text");
  });
});
