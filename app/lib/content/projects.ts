import { Effect, Schema } from "effect";
import { ProjectContent } from "@/lib/schemas/project";
import { ContentParseError } from "@/models/errors/content";
import { parseFrontmatter, parseSections } from "./frontmatter";

/**
 * Project content sourced from markdown files bundled at build time. Replaces
 * the old D1 `project` table + `ProjectRepository` + tRPC `projects` router
 * (feat-008/009). `import.meta.glob(..., { query: "?raw", eager: true })`
 * inlines every `content/projects/*.md` file's raw string into the bundle, so
 * this works on the Cloudflare Workers runtime with no `fs` and no DB round
 * trip.
 *
 * Files are parsed + validated once at module load. A malformed file fails
 * loudly here (via `Effect.runSync` surfacing a `ContentParseError`) rather
 * than silently rendering broken output.
 */

// Raw markdown strings keyed by file path. Path is relative to THIS module
// (app/lib/content/) → up three levels to the repo root, then content/projects.
const FILES = import.meta.glob("../../../content/projects/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

/** Prev/next neighbour reference used by the case-study footer. */
export interface ProjectNeighbour {
  readonly slug: string;
  readonly title: string;
}

export interface CaseStudy {
  readonly project: ProjectContent;
  readonly prev: ProjectNeighbour | null;
  readonly next: ProjectNeighbour | null;
}

/**
 * Parses + validates a single markdown file into a `ProjectContent`. Fails
 * with `ContentParseError` on a malformed frontmatter block or a schema
 * validation failure. `## WHY` / `## HOW` / `## SOLUTION` body sections map
 * to the `why` / `how` / `solution` fields.
 */
export const parseProjectFile = (
  file: string,
  raw: string
): Effect.Effect<ProjectContent, ContentParseError> =>
  Effect.gen(function* () {
    const parsed = parseFrontmatter(raw);
    if (!parsed.ok) {
      return yield* Effect.fail(
        new ContentParseError({ file, reason: parsed.reason })
      );
    }

    const sections = parseSections(parsed.value.body);
    const candidate = {
      ...parsed.value.data,
      why: sections.why,
      how: sections.how,
      solution: sections.solution,
    };

    return yield* Schema.decodeUnknown(ProjectContent)(candidate).pipe(
      Effect.mapError(
        (error) => new ContentParseError({ file, reason: String(error) })
      )
    );
  });

/**
 * Same ordering as the old repository: featured first, then ascending
 * `sortOrder`. Pure so it can be reasoned about independently of the glob.
 */
export function sortProjects(
  projects: ReadonlyArray<ProjectContent>
): ProjectContent[] {
  return [...projects].sort(
    (a, b) =>
      Number(b.featured) - Number(a.featured) || a.sortOrder - b.sortOrder
  );
}

// Parse + validate every bundled file at module load. `runSync` throws a
// FiberFailure if any file fails validation — intentional: broken committed
// content should fail the build/tests, not degrade silently at runtime.
const PROJECTS: ReadonlyArray<ProjectContent> = sortProjects(
  Effect.runSync(
    Effect.forEach(Object.entries(FILES), ([file, raw]) =>
      parseProjectFile(file, raw)
    )
  )
);

/** All projects, ordered featured-first then by `sortOrder`. */
export function listProjects(): ReadonlyArray<ProjectContent> {
  return PROJECTS;
}

/** The project with this slug, or `undefined` if none matches. */
export function getProjectBySlug(slug: string): ProjectContent | undefined {
  return PROJECTS.find((project) => project.slug === slug);
}

/**
 * Prev/next neighbours by the list ordering, wrapping around at both ends so
 * the case-study footer is always navigable. Returns `{ prev: null, next:
 * null }` for an unknown slug or a single-project catalog.
 */
export function getAdjacentProjects(slug: string): {
  prev: ProjectNeighbour | null;
  next: ProjectNeighbour | null;
} {
  const index = PROJECTS.findIndex((project) => project.slug === slug);
  if (index === -1 || PROJECTS.length <= 1) {
    return { prev: null, next: null };
  }

  const prev = PROJECTS[(index - 1 + PROJECTS.length) % PROJECTS.length];
  const next = PROJECTS[(index + 1) % PROJECTS.length];
  return {
    prev: { slug: prev.slug, title: prev.title },
    next: { slug: next.slug, title: next.title },
  };
}

/**
 * The case-study payload for a slug: the project plus its prev/next
 * neighbours. `undefined` when the slug is unknown (the loader translates
 * this into a 404 `Response`).
 */
export function getCaseStudy(slug: string): CaseStudy | undefined {
  const project = getProjectBySlug(slug);
  if (!project) return undefined;
  return { project, ...getAdjacentProjects(slug) };
}
