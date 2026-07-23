# Feature: Projects Showcase

_Last updated: 2026-07-22_

## Purpose
Public `/projects` page listing Sean's skills, portfolios, and personal projects as a minimalist card grid, sourced from **bundled markdown** (`content/projects/*.md`) parsed at build time. First content feature of portfolio-v3; establishes the project content model that the case-study page (feat-009) reads from.

> **2026-07-22 refactor:** projects moved off D1 entirely. The `project` table, `ProjectRepository`, and the tRPC `projects` router were deleted; content now lives in markdown files bundled via `import.meta.glob`. See the "How It Works" and Changelog below.

## When It's Used
- Visitor navigates to `/projects` (public, no auth)
- Home page CTA links here
- Cards link into `/projects/:slug` (feat-009)

## How It Works
React Router loader calls `listProjects()` from `app/lib/content/projects.ts` (no tRPC, no `context`) → returns all projects parsed from `content/projects/*.md`, ordered featured-first then `sortOrder` asc → renders 2-col white-card grid per design spec (`.brain/high-level-architecture/design-language.md`): macOS-chrome-framed thumbnail, title (700), one-line summary (500 gray), SF Mono meta `YEAR · STACK · ROLE`, filter pills by category (client-side via `?category=`), one full-width featured card per 4 items. UI is pixel-identical to the pre-refactor D1-backed version.

### Persistence details
- Storage: **bundled markdown** — one `content/projects/<slug>.md` per project. Frontmatter holds scalar/array fields (`slug`, `title`, `summary`, `category`, `year`, `stack`, `role`, `featured`, `sortOrder`, optional `client`/`thumbnailUrl`/`heroImageUrl`/`stats`); body holds `## WHY` / `## HOW` / `## SOLUTION` sections.
- Bundling: `import.meta.glob("../../../content/projects/*.md", { query: "?raw", import: "default", eager: true })` inlines the raw strings into the Worker bundle at build — no `fs`, no DB, Workers-safe.
- Parsing/validation: pure parser `app/lib/content/frontmatter.ts` (`parseFrontmatter` + `parseSections`); validated once at module load against the `ProjectContent` Effect Schema (`app/lib/schemas/project.ts`). A malformed file fails loudly with `ContentParseError` (`app/models/errors/content.ts`) instead of silently rendering.
- Writes: edit the markdown files directly — no seed, no DB. (No D1 rows; `scripts/seed-preview.ts` no longer seeds projects.)

### Testability
- `app/lib/content/__tests__/frontmatter.test.ts` — `parseFrontmatter` (scalars/numbers/booleans/JSON arrays/objects, first-colon split, malformed fence, missing colon) + `parseSections` (extract, missing section, empty section)
- `app/lib/content/__tests__/projects.test.ts` — `parseProjectFile` (happy, missing section → undefined, malformed frontmatter → `ContentParseError`, missing required field → `ContentParseError`), `sortProjects` ordering, + the real bundled content (list/getBySlug/getAdjacent/getCaseStudy happy + unknown-slug paths)
- `getProjectMeta` helper (`app/lib/project-meta.ts`) — 4 unit tests, unchanged
- `ProjectContent` Effect Schema — 6 unit tests (`app/lib/schemas/__tests__/project.test.ts`): minimal/full decode + rejection per field
- feature-verifier browser walk (pre-refactor) → **PASS** — [`verifications/2026-07-21.md`](verifications/2026-07-21.md). Re-verification of the markdown-backed version is a main-thread hand-off.

## Key Files

| File | Role |
|------|------|
| `content/projects/*.md` | **Source of truth** — one markdown file per project (frontmatter + `## WHY`/`## HOW`/`## SOLUTION` body) |
| `app/lib/content/frontmatter.ts` | Pure parser — `parseFrontmatter` (fenced `key: value` block, JSON-coerced values) + `parseSections` (`## heading` → text map) |
| `app/lib/content/projects.ts` | Content module — glob load + validate; `listProjects`, `getProjectBySlug`, `getAdjacentProjects`, `getCaseStudy`, `parseProjectFile`, `sortProjects` |
| `app/lib/content/__tests__/frontmatter.test.ts` | Parser unit tests |
| `app/lib/content/__tests__/projects.test.ts` | Content module + `parseProjectFile` + `sortProjects` unit tests |
| `app/lib/schemas/project.ts` | Effect Schema — `ProjectContent` (+ `ProjectStat`); frontmatter/body validation |
| `app/lib/schemas/__tests__/project.test.ts` | `ProjectContent` schema unit tests (6) |
| `app/models/errors/content.ts` | `ContentParseError` tagged error (mapped in `tagToTRPC`) |
| `app/routes.ts` | `/projects` + `:lng/projects` registered (mirrors home/login/sign-up convention) |
| `app/routes/projects/index.tsx` | `/projects` UI — loader calls `listProjects()` (full unfiltered set), 2-col grid, filter pills via `?category=` search param (client + SSR shared), nav (wordmark/Projects/Marketplace/mailto CTA) |
| `drizzle/0003_square_abomination.sql` | Drop migration for the removed `project` table |
| `app/components/macos-frame.tsx` | Reusable window-chrome card (dots + title bar) — shared with home hero (feat-007) + case study (feat-009) |
| `app/components/project-card.tsx` | Card component — thumbnail-in-`MacosFrame` (silver-mist fallback block + slug label when `thumbnailUrl` null), SF Mono meta row, `featured` prop → full-width horizontal layout |
| `app/lib/project-meta.ts` | `getProjectMeta` — pure helper building the `YEAR · STACK · ROLE` meta row (max 3 tokens, stack[0] only) |
| `app/locales/{en,zh}/projects.json` | i18n copy — `nav`, `title`, `count` (pluralized `_one`/`_other`), `filters.all`, `empty`. Category/stack/role tokens are data-driven and intentionally untranslated (same precedent as `home.tsx`'s `STACK` badges). |
| `app/app.css` | New fixed (non-dark-adaptive) portfolio tokens: `--canvas-mist`, `--carbon`, `--pure-white`, `--graphite`, `--pale-stone`, `--silver-mist` — see `rules/frontend.md` "Portfolio surface tokens" |

## Dependencies
- Bundled markdown (`content/projects/*.md`) + `import.meta.glob` (Vite/Workers build) — no `Database` service
- Design spec: `.brain/high-level-architecture/design-language.md`
- shadcn primitives minimal — mostly custom monochrome styles

## Known gaps / deviations
- **`:lng/projects` doesn't actually translate.** `app/root.tsx`'s loader calls `i18nServer.getLocale(request)` (cookie/header detection only) — it never reads `params.lng`, so visiting `/zh/projects` renders English copy. This is a **pre-existing** gap shared by `/zh` (home), `/zh/login`, `/zh/sign-up` — not introduced by this task and out of scope for `add-route.md` (fixing the `:lng` param → locale wiring is a separate cross-cutting i18n task).
- Nav hides the `Projects`/`Marketplace` text links below `sm:` (matches `home.tsx`'s existing `hidden sm:inline-flex` precedent for the GitHub link) — the design spec's nav is written for desktop; without this, wordmark and first nav link visually collide at narrow widths because `justify-between` only distributes space between the two top-level flex children.
- CTA links to `mailto:sean@casperstudios.xyz` — no `/contact` page exists yet; reasonable default per "your call" in the task, not a documented spec requirement.

## Tagged Errors

| Error | Where raised | tRPC code |
|-------|--------------|-----------|
| `ContentParseError` | `parseProjectFile` (malformed frontmatter / schema validation failure) | INTERNAL_SERVER_ERROR (defensive — never reaches a client; parsing is at module load) |

## Changelog

| Date | Type | Description |
|------|------|-------------|
| 2026-07-22 | refactor | **Moved projects off D1 to bundled markdown.** New `content/projects/*.md` (4 files, ported verbatim from the old `PROJECT_FIXTURES`), pure parser `app/lib/content/frontmatter.ts`, content module `app/lib/content/projects.ts` (glob + `ProjectContent` Effect Schema validation), `ContentParseError` tagged error. Rewired `app/routes/projects/index.tsx` loader to `listProjects()` (dropped tRPC). **Deleted**: `project` table (migration `drizzle/0003_square_abomination.sql`), `ProjectRepository` + tests, `app/trpc/routes/projects.ts`, `projects` from `appRouter`, `ProjectRepository` from `runtime.ts`, `PROJECT_FIXTURES` from `scripts/seed-preview.ts`. Component/helper `Project` type imports repointed to `ProjectContent`. typecheck + 373 tests + build all green. Status left `in-progress` pending main-thread browser verification. |
| 2026-07-21 | feature | Post-verify hardening: schema unit tests (`app/lib/schemas/__tests__/project.test.ts`, effect-ts-enforcer finding), `project` re-exported from `app/lib/schemas/index.ts`, projects-count shows filtered length (feature-verifier finding). feature-verifier verdict PASS — `verifications/2026-07-21.md`. |
| 2026-07-22 | feature | UI shipped via `add-route.md` recipe (recipe-runner): `app/routes/projects/index.tsx` (`/projects` + `:lng/projects`), `app/components/macos-frame.tsx` (reusable, shared), `app/components/project-card.tsx`, `app/lib/project-meta.ts` (+4 unit tests), `projects` i18n namespace (en+zh), new fixed portfolio design tokens in `app/app.css` per `design-language.md`. Category filter via `?category=` search param, client + SSR shared filtering. Self-verified via throwaway Playwright script (screenshots, computed-style hover check, mobile viewport). Typecheck/test(238 passing)/build all green. Status left `in-progress` pending `verify-done-runner` + `feature-verifier` passes — those are separate hand-offs, not run by recipe-runner. See "Known gaps / deviations" above. |
| 2026-07-22 | feature | API layer shipped via `add-trpc-endpoint.md` recipe: `app/trpc/routes/projects.ts` (`list`, `getBySlug` — both `publicProcedure`), registered as `projects` on `appRouter` (`app/trpc/router.ts`). No new tagged error (`NotFoundError` already mapped). No new router-level test file — repo convention is repo-level tests only (`project.test.ts` already covers this). UI (`/projects` route, `project-card.tsx`) still pending — separate task. |
| 2026-07-21 | feature | Data layer shipped via `add-db-table.md` recipe: `project` table + migration, `ProjectRepository` (`list`/`getBySlug`), `app/lib/schemas/project.ts`, 6 unit tests, wired into `app/runtime.ts`, seed fixtures (4 projects). tRPC routes + UI still pending — separate task. |
| 2026-07-21 | feature | Planned — design research done, data model scoped |
