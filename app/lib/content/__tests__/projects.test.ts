import { describe, it, expect } from "vitest";
import { Effect, Exit, Cause } from "effect";
import {
  parseProjectFile,
  sortProjects,
  listProjects,
  getProjectBySlug,
  getAdjacentProjects,
  getCaseStudy,
} from "../projects";
import { ContentParseError } from "@/models/errors/content";
import type { ProjectContent } from "@/lib/schemas/project";

const validRaw = [
  "---",
  "slug: sample",
  "title: Sample",
  "summary: A sample project.",
  "category: saas",
  "year: 2026",
  'stack: ["react-router", "d1"]',
  "role: Solo builder",
  "featured: true",
  "sortOrder: 0",
  "---",
  "",
  "## WHY",
  "the why",
  "",
  "## HOW",
  "the how",
  "",
  "## SOLUTION",
  "the solution",
].join("\n");

const expectFailure = (exit: Exit.Exit<unknown, ContentParseError>) => {
  expect(Exit.isFailure(exit)).toBe(true);
  if (Exit.isFailure(exit)) {
    const failure = Cause.failureOption(exit.cause);
    expect(failure._tag).toBe("Some");
    if (failure._tag === "Some") {
      expect(failure.value).toBeInstanceOf(ContentParseError);
    }
  }
};

describe("parseProjectFile", () => {
  it("parses a valid file into a ProjectContent with body sections", () => {
    const project = Effect.runSync(parseProjectFile("sample.md", validRaw));
    expect(project.slug).toBe("sample");
    expect(project.stack).toEqual(["react-router", "d1"]);
    expect(project.featured).toBe(true);
    expect(project.why).toBe("the why");
    expect(project.how).toBe("the how");
    expect(project.solution).toBe("the solution");
  });

  it("leaves a missing body section undefined", () => {
    const noSolution = validRaw.replace("## SOLUTION\nthe solution", "").trimEnd();
    const project = Effect.runSync(parseProjectFile("sample.md", noSolution));
    expect(project.why).toBe("the why");
    expect(project.how).toBe("the how");
    expect(project.solution).toBeUndefined();
  });

  it("fails with ContentParseError on malformed frontmatter", () => {
    const exit = Effect.runSyncExit(
      parseProjectFile("bad.md", "no frontmatter\n## WHY\nx")
    );
    expectFailure(exit);
  });

  it("fails with ContentParseError when a required field is missing", () => {
    const noTitle = validRaw.replace("title: Sample\n", "");
    const exit = Effect.runSyncExit(parseProjectFile("bad.md", noTitle));
    expectFailure(exit);
  });
});

describe("sortProjects", () => {
  it("orders featured first, then by ascending sortOrder", () => {
    const make = (
      slug: string,
      featured: boolean,
      sortOrder: number
    ): ProjectContent =>
      ({
        slug,
        title: slug,
        summary: "",
        category: "x",
        year: 2026,
        stack: [],
        role: "r",
        featured,
        sortOrder,
      }) as ProjectContent;

    const sorted = sortProjects([
      make("c", false, 2),
      make("a", true, 0),
      make("b", false, 1),
    ]);
    expect(sorted.map((p) => p.slug)).toEqual(["a", "b", "c"]);
  });
});

// The following exercise the real bundled content/projects/*.md files via
// import.meta.glob (Vite/vitest resolve it at test time).
describe("content module (bundled markdown)", () => {
  it("lists all seeded projects, featured first", () => {
    const projects = listProjects();
    expect(projects.length).toBeGreaterThanOrEqual(4);
    expect(projects[0].featured).toBe(true);
    // Ordering invariant: featured first, then ascending sortOrder.
    const featuredFlags = projects.map((p) => Number(p.featured));
    expect(featuredFlags).toEqual([...featuredFlags].sort((a, b) => b - a));
  });

  it("resolves a known slug", () => {
    expect(getProjectBySlug("portfolio-v3")?.title).toBe("portfolio-v3");
  });

  it("returns undefined for an unknown slug", () => {
    expect(getProjectBySlug("does-not-exist")).toBeUndefined();
  });

  it("returns prev/next neighbours that wrap around", () => {
    const projects = listProjects();
    const first = projects[0].slug;
    const { prev, next } = getAdjacentProjects(first);
    expect(prev).not.toBeNull();
    expect(next).not.toBeNull();
    // First project's prev wraps to the last project.
    expect(prev?.slug).toBe(projects[projects.length - 1].slug);
  });

  it("getCaseStudy returns undefined for an unknown slug", () => {
    expect(getCaseStudy("does-not-exist")).toBeUndefined();
  });

  it("getCaseStudy returns the project plus neighbours for a known slug", () => {
    const caseStudy = getCaseStudy("portfolio-v3");
    expect(caseStudy?.project.slug).toBe("portfolio-v3");
    expect(caseStudy).toHaveProperty("prev");
    expect(caseStudy).toHaveProperty("next");
  });
});
