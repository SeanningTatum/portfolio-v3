import { Schema } from "effect";

/**
 * A single labelled figure in a case-study's stats row (e.g.
 * `{ label: "Unit tests", value: "234+" }`).
 */
export const ProjectStat = Schema.Struct({
  label: Schema.String,
  value: Schema.String,
});
export type ProjectStat = typeof ProjectStat.Type;

/**
 * The validated shape of a project sourced from a `content/projects/*.md`
 * file. Scalar/array fields come from the frontmatter block; `why` / `how` /
 * `solution` come from the markdown body's `## WHY` / `## HOW` / `## SOLUTION`
 * sections. Case-study fields are optional — a project without a detail page
 * (no body sections, no client/hero/stats) validates fine.
 *
 * Replaces the old D1 `project` table row shape (feat-008/009): projects are
 * now bundled markdown, not database rows.
 */
export const ProjectContent = Schema.Struct({
  slug: Schema.String,
  title: Schema.String,
  summary: Schema.String,
  category: Schema.String,
  year: Schema.Number,
  stack: Schema.Array(Schema.String),
  role: Schema.String,
  thumbnailUrl: Schema.optional(Schema.NullOr(Schema.String)),
  featured: Schema.Boolean,
  sortOrder: Schema.Number,

  // Case-study fields — optional until a project's detail page is authored.
  client: Schema.optional(Schema.NullOr(Schema.String)),
  heroImageUrl: Schema.optional(Schema.NullOr(Schema.String)),
  why: Schema.optional(Schema.NullOr(Schema.String)),
  how: Schema.optional(Schema.NullOr(Schema.String)),
  solution: Schema.optional(Schema.NullOr(Schema.String)),
  stats: Schema.optional(Schema.NullOr(Schema.Array(ProjectStat))),
});
export type ProjectContent = typeof ProjectContent.Type;
