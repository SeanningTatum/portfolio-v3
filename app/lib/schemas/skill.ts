import { Schema } from "effect";

export const SkillType = Schema.Literal(
  "skill",
  "command",
  "agent",
  "rule",
  "hook"
);
export type SkillType = typeof SkillType.Type;

/**
 * The validated shape of a marketplace skill sourced from a
 * `content/skills/*.md` file. All fields come from the frontmatter block;
 * skills have no markdown body sections (unlike project case studies).
 *
 * Replaces the old D1 `skill` table row shape + `SkillRepository` + tRPC
 * `skills` router: marketplace content is now bundled markdown, not database
 * rows (mirrors the `content/projects/*.md` refactor).
 */
export const SkillContent = Schema.Struct({
  slug: Schema.String,
  name: Schema.String,
  description: Schema.String,
  type: SkillType,
  category: Schema.String,
  plugin: Schema.String,
  repoUrl: Schema.String,
  isNew: Schema.Boolean,
  sortOrder: Schema.Number,
});
export type SkillContent = typeof SkillContent.Type;
