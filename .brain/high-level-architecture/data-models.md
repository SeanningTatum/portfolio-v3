# Data Models

## Schema location

**Source of truth:** [`app/db/schema.ts`](../../app/db/schema.ts). Always read it directly for current column lists.

## Tables

| Table | Purpose | Key relations |
|-------|---------|---------------|
| `user` | Core user with role + ban fields | Referenced by `session.userId`, `account.userId` |
| `session` | Active sessions (Better Auth) | `userId → user.id` (cascade), `impersonatedBy` (admin user id, no FK) |
| `account` | Credential / OAuth accounts | `userId → user.id` (cascade) |
| `verification` | Email verification tokens | Linked logically by `identifier` (email) |

All four tables are owned by Better Auth's drizzle adapter — there are **no app-specific business tables**. The two content-bearing features (`/projects` and `/marketplace`) both read from bundled markdown, not D1 (see the two sections below).

> **Neither projects nor marketplace skills are D1 tables.** The `/projects` list (feat-008) + `/projects/:slug` case study (feat-009) read from `content/projects/*.md`; the `/marketplace` page (feat-010) reads from `content/skills/*.md`. The `project` table was dropped in migration `drizzle/0003_square_abomination.sql` (2026-07-22); the `skill` table in `drizzle/0004_public_korath.sql` (2026-07-23).

## Entity relationships

```
user ◄─────┬───── session   (userId, impersonatedBy)
           │
           ├───── account   (userId)
           │
           └─ ─ ─ verification (by identifier=email, no FK)
```

## Project content (markdown, not D1)

Portfolio project content (feat-008/009) lives in **`content/projects/<slug>.md`**, bundled into the Worker at build time via `import.meta.glob("...", { query: "?raw", eager: true })` — no `fs`, no DB round trip. One file per project: frontmatter holds the scalar/array fields (`slug`, `title`, `summary`, `category`, `year`, `stack`, `role`, `featured`, `sortOrder`, optional `client`/`thumbnailUrl`/`heroImageUrl`/`stats`); the body holds `## WHY` / `## HOW` / `## SOLUTION` sections.

- Parser: `app/lib/content/frontmatter.ts` (pure `parseFrontmatter` + `parseSections`, no deps).
- Content module: `app/lib/content/projects.ts` — `listProjects()`, `getProjectBySlug(slug)`, `getAdjacentProjects(slug)`, `getCaseStudy(slug)`. Files are validated once at module load against the `ProjectContent` Effect Schema (`app/lib/schemas/project.ts`); a malformed file fails loudly with `ContentParseError` (`app/models/errors/content.ts`).
- Ordering matches the old repository: featured first, then ascending `sortOrder`.
- Loaders (`app/routes/projects/index.tsx`, `$slug.tsx`) call the content module directly — no tRPC, no `context`.

## Marketplace skill content (markdown, not D1)

Marketplace skill content (feat-010) lives in **`content/skills/<slug>.md`**, bundled the same way as projects — no `fs`, no DB. One file per skill; all fields are frontmatter (skills have no `##` body sections): `slug`, `name`, `description`, `type` (`SkillType` literal — `"skill" | "command" | "agent" | "rule" | "hook"`), `category` (free text, e.g. `"engineering"` / `"marketing"`), `plugin` (e.g. `"engineering-toolkit"`), `repoUrl` (GitHub outlink), `isNew` (bool), `sortOrder`.

- Parser: shared `app/lib/content/frontmatter.ts`.
- Content module: `app/lib/content/skills.ts` — `listSkills()`, validated once at module load against the `SkillContent` Effect Schema (`app/lib/schemas/skill.ts`); a malformed file fails loudly with `ContentParseError`.
- Ordering matches the old repository: ascending `sortOrder`, then name.
- Loader (`app/routes/marketplace/index.tsx`) calls `listSkills()` directly — no tRPC, no `context`. Category filter + search + sort are client-side.
- Content: 8 skills (6 `engineering-toolkit` + 2 `marketing-toolkit`) — see `.brain/features/skills-marketplace/skills-inventory.md`.

## SQLite / Drizzle conventions

- **Booleans**: `integer("col", { mode: "boolean" })` (stored as 0/1)
- **Timestamps**: `integer("col", { mode: "timestamp_ms" })` — Date ↔ ms-since-epoch. Default via `sql\`(cast(unixepoch('subsecond') * 1000 as integer))\`` for `createdAt` / `updatedAt`. `$onUpdate(() => new Date())` for `updatedAt`.
- **Enums**: `text("col", { enum: [...] })` — e.g. `user.role: "user" | "admin"`
- **JSON**: `text("col", { mode: "json" }).$type<T>()`
- **Foreign keys**: `references(() => parent.id, { onDelete: "cascade" })`. Always specify `onDelete`.
- **SQL identifiers**: `snake_case`. **TypeScript variables**: `camelCase`.

## Inferred types

```typescript
export type User = typeof user.$inferSelect;
export type UpdateUserInput = typeof user.$inferInsert;
```

Repository input types use Effect Schema in `app/lib/schemas/{domain}.ts` — those are the **canonical** input shapes for procedures and repos. Inferred Drizzle types are for raw row shape only.

## Migrations

- **Location**: `drizzle/`
- **Generate**: `bun run db:generate`
- **Apply locally**: `bun run db:migrate:local` (auto-runs on `bun run dev`)
- **Apply remote**: `bun run db:migrate:remote`
- **Studio**: `bun run db:studio`

See [`../rules/repository.md`](../rules/repository.md) for the full Drizzle pattern.
