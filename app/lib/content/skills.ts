import { Effect, Schema } from "effect";
import { SkillContent } from "@/lib/schemas/skill";
import { ContentParseError } from "@/models/errors/content";
import { parseFrontmatter } from "./frontmatter";

/**
 * Marketplace skill content sourced from markdown files bundled at build time.
 * Replaces the old D1 `skill` table + `SkillRepository` + tRPC `skills` router
 * (feat-010). `import.meta.glob(..., { query: "?raw", eager: true })` inlines
 * every `content/skills/*.md` file's raw string into the bundle, so this works
 * on the Cloudflare Workers runtime with no `fs` and no DB round trip — the
 * same pattern as `content/projects/*.md`.
 *
 * Files are parsed + validated once at module load. A malformed file fails
 * loudly here (via `Effect.runSync` surfacing a `ContentParseError`) rather
 * than silently rendering broken output.
 */

// Raw markdown strings keyed by file path. Path is relative to THIS module
// (app/lib/content/) → up three levels to the repo root, then content/skills.
const FILES = import.meta.glob("../../../content/skills/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

/**
 * Parses + validates a single markdown file into a `SkillContent`. Skills
 * carry all their data in frontmatter (no `##` body sections), so the body is
 * ignored. Fails with `ContentParseError` on a malformed frontmatter block or
 * a schema validation failure.
 */
export const parseSkillFile = (
  file: string,
  raw: string
): Effect.Effect<SkillContent, ContentParseError> =>
  Effect.gen(function* () {
    const parsed = parseFrontmatter(raw);
    if (!parsed.ok) {
      return yield* Effect.fail(
        new ContentParseError({ file, reason: parsed.reason })
      );
    }

    return yield* Schema.decodeUnknown(SkillContent)(parsed.value.data).pipe(
      Effect.mapError(
        (error) => new ContentParseError({ file, reason: String(error) })
      )
    );
  });

/**
 * Same ordering as the old repository: ascending `sortOrder`, then name as a
 * stable tie-break. Pure so it can be reasoned about independently of the glob.
 */
export function sortSkills(
  skills: ReadonlyArray<SkillContent>
): SkillContent[] {
  return [...skills].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)
  );
}

// Parse + validate every bundled file at module load. `runSync` throws a
// FiberFailure if any file fails validation — intentional: broken committed
// content should fail the build/tests, not degrade silently at runtime.
const SKILLS: ReadonlyArray<SkillContent> = sortSkills(
  Effect.runSync(
    Effect.forEach(Object.entries(FILES), ([file, raw]) =>
      parseSkillFile(file, raw)
    )
  )
);

/** All skills, ordered by `sortOrder` then name. */
export function listSkills(): ReadonlyArray<SkillContent> {
  return SKILLS;
}
