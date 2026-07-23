import type { ProjectContent } from "@/lib/schemas/project";

/**
 * Builds the SF Mono meta row shown on a project card: `YEAR · STACK · ROLE`
 * (design spec: `.brain/high-level-architecture/design-language.md`
 * "/projects (list)"). Max 3 tokens; stack shows only its first entry.
 * Falsy/empty tokens (e.g. an empty `stack` array) are dropped rather than
 * rendered as empty `· ·` separators.
 */
export function getProjectMeta(
  project: Pick<ProjectContent, "year" | "stack" | "role">
): string[] {
  return [String(project.year), project.stack[0], project.role]
    .filter((token): token is string => Boolean(token))
    .slice(0, 3);
}
