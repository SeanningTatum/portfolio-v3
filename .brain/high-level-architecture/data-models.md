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
| `project` | Portfolio showcase content (feat-008/009) | No FKs — standalone content table |
| `skill` | Claude skills marketplace content (feat-010) | No FKs — standalone content table |

The first four tables are owned by Better Auth's drizzle adapter. `project` is the first app-specific business table — content for the public `/projects` list (feat-008) and `/projects/:slug` case-study page (feat-009). `skill` is the data source for the public `/marketplace` page (feat-010).

### `project`

`id`, `slug` (unique + indexed), `title`, `summary`, `category` (free text, no enum constraint — validated at the Effect Schema boundary instead so new categories don't need a migration), `year`, `stack` (JSON `text` array), `role`, `thumbnailUrl` (nullable), `featured` (bool, default false), `sortOrder` (int, default 0), plus nullable case-study fields for feat-009: `client`, `heroImageUrl`, `why`, `how`, `solution`, `statsJson` (JSON array of `{ label, value }`). `createdAt`/`updatedAt` per convention.

Repository: `app/repositories/project.ts` (`ProjectRepository.list(filter?)` ordered `featured DESC, sortOrder ASC`; `ProjectRepository.getBySlug(slug)` → `NotFoundError` on miss). Inputs: `app/lib/schemas/project.ts`.

### `skill`

`id`, `slug` (unique + indexed), `name`, `description`, `type` (free text — `"skill" | "command" | "agent" | "rule" | "hook"`, validated at the Effect Schema boundary via `SkillType` literal union, no DB enum), `category` (free text, e.g. `"engineering" | "stack-conventions" | "workflow" | "commands" | "agents"` — no enum constraint), `plugin` (e.g. `"engineering-toolkit"`), `marketplaceRepo` (e.g. `"sean-skills"` | `"seanningtatum-plugins"`), `repoUrl`, `isNew` (bool, default false), `sortOrder` (int, default 0). `createdAt`/`updatedAt` per convention.

Repository: `app/repositories/skill.ts` (`SkillRepository.list(filter?: { category?, type? })` combines both filters with `and()` when given, ordered `sortOrder ASC, name ASC`). Inputs: `app/lib/schemas/skill.ts` (`ListSkillsInput`, `SkillType`). Seeded from `.brain/features/skills-marketplace/skills-inventory.md` via `scripts/seed-preview.ts` — 55 public rows (57 total minus the 2 `example-skill` templates).

## Entity relationships

```
user ◄─────┬───── session   (userId, impersonatedBy)
           │
           ├───── account   (userId)
           │
           └─ ─ ─ verification (by identifier=email, no FK)

project (standalone — no FKs)
skill (standalone — no FKs)
```

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
