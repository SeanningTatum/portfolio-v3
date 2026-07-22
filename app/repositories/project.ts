import { Effect } from "effect";
import { asc, desc, eq } from "drizzle-orm";
import { project } from "@/db/schema";
import { Database } from "@/services/database";
import { tryQuery, requireFound } from "@/lib/effect-utils";
import type {
  ListProjectsInput,
  GetProjectBySlugInput,
} from "@/lib/schemas/project";

export class ProjectRepository extends Effect.Service<ProjectRepository>()(
  "app/ProjectRepository",
  {
    effect: Effect.gen(function* () {
      const { db } = yield* Database;

      const list = (input: ListProjectsInput = {}) =>
        Effect.gen(function* () {
          const condition = input.category
            ? eq(project.category, input.category)
            : undefined;

          return yield* tryQuery("project", () =>
            db
              .select()
              .from(project)
              .where(condition)
              .orderBy(desc(project.featured), asc(project.sortOrder))
          );
        });

      const getBySlug = (input: GetProjectBySlugInput) =>
        Effect.gen(function* () {
          const rows = yield* tryQuery("project", () =>
            db.select().from(project).where(eq(project.slug, input.slug)).limit(1)
          );
          return yield* requireFound("project", input.slug, rows[0]);
        });

      // Prev/next by the same ordering as `list` (featured desc, sortOrder
      // asc). Wrap-around by design call (not spec'd in design-language.md):
      // the last project's "next" is the first and vice versa, so the
      // case-study footer is always navigable instead of dead-ending at
      // either end of the ordered list. A missing slug or a single-project
      // catalog both resolve to `{ prev: null, next: null }` rather than a
      // tagged error — the caller (`getBySlug`) already owns the
      // not-found-for-this-slug case.
      const getAdjacent = (input: GetProjectBySlugInput) =>
        Effect.gen(function* () {
          const rows = yield* tryQuery("project", () =>
            db
              .select({ slug: project.slug, title: project.title })
              .from(project)
              .orderBy(desc(project.featured), asc(project.sortOrder))
          );

          const index = rows.findIndex((row) => row.slug === input.slug);
          if (index === -1 || rows.length <= 1) {
            return { prev: null, next: null };
          }

          const prev = rows[(index - 1 + rows.length) % rows.length];
          const next = rows[(index + 1) % rows.length];
          return { prev, next };
        });

      return { list, getBySlug, getAdjacent } as const;
    }),
  }
) {}
