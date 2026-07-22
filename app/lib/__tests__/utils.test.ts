import { describe, it, expect } from "vitest";
import { cn, getInitials, splitParagraphs } from "../utils";

describe("getInitials", () => {
  it("takes first letter of first two words", () => {
    expect(getInitials("Jane Doe")).toBe("JD");
  });

  it("caps at two characters for long names", () => {
    expect(getInitials("Anna Maria van Beek")).toBe("AM");
  });

  it("handles single-word names", () => {
    expect(getInitials("admin")).toBe("A");
  });

  it("ignores extra whitespace between words", () => {
    expect(getInitials("Jane  Doe")).toBe("JD");
  });

  it("returns empty string for empty input", () => {
    expect(getInitials("")).toBe("");
  });
});

describe("cn", () => {
  it("merges class names from arguments", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("ignores falsy values", () => {
    expect(cn("a", null, undefined, false, "b")).toBe("a b");
  });

  it("collapses tailwind conflicts (later wins)", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("supports object and array forms via clsx", () => {
    expect(cn({ a: true, b: false }, ["c"])).toBe("a c");
  });

  it("returns empty string when no inputs", () => {
    expect(cn()).toBe("");
  });
});

describe("splitParagraphs", () => {
  it("splits on a blank line", () => {
    expect(splitParagraphs("First paragraph.\n\nSecond paragraph.")).toEqual([
      "First paragraph.",
      "Second paragraph.",
    ]);
  });

  it("trims whitespace around each paragraph", () => {
    expect(splitParagraphs("  First.  \n\n  Second.  ")).toEqual([
      "First.",
      "Second.",
    ]);
  });

  it("handles CRLF blank lines", () => {
    expect(splitParagraphs("First.\r\n\r\nSecond.")).toEqual([
      "First.",
      "Second.",
    ]);
  });

  it("drops empty paragraphs from leading/trailing/extra blank lines", () => {
    expect(splitParagraphs("\n\nFirst.\n\n\n\nSecond.\n\n")).toEqual([
      "First.",
      "Second.",
    ]);
  });

  it("returns a single-element array for text with no blank lines", () => {
    expect(splitParagraphs("Just one paragraph, no breaks.")).toEqual([
      "Just one paragraph, no breaks.",
    ]);
  });

  it("returns an empty array for empty input", () => {
    expect(splitParagraphs("")).toEqual([]);
  });
});
