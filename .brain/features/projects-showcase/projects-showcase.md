# Feature: Projects Showcase

_Last updated: 2026-07-22_

## Purpose
Public `/projects` page listing Sean's skills, portfolios, and personal projects as a minimalist card grid, backed by a D1 `project` table. First content feature of portfolio-v3; establishes the project data model that the case-study page (feat-009) reads from.

## When It's Used
- Visitor navigates to `/projects` (public, no auth)
- Home page CTA links here
- Cards link into `/projects/:slug` (feat-009)

## How It Works
React Router loader calls tRPC `projects.list` via `runProcedure` (publicProcedure) → `ProjectRepository.list()` (Effect.Service over Drizzle/D1) → renders 2-col white-card grid per design spec (`.brain/high-level-architecture/design-language.md`): macOS-chrome-framed thumbnail, title (700), one-line summary (500 gray), SF Mono meta `YEAR · STACK · ROLE`, filter pills by category, one full-width featured card per 4 items.

### Persistence details
- Storage: D1 table `project` (Drizzle schema in `app/db/schema.ts` — repo convention, not `database/schema.ts` as originally scoped)
- Shape: id, slug (unique+indexed), title, summary, category, year, stack (JSON array), role, thumbnailUrl, featured (bool), sortOrder, + case-study fields for feat-009 (why, how, solution, statsJson, client, heroImageUrl), createdAt/updatedAt
- Writes: seed script only for now (no admin CRUD yet); extended `scripts/seed-preview.ts` with 4 representative fixtures
- Migration via `bun run db:generate` + `db:migrate:local` (`drizzle/0001_funny_doctor_strange.sql`)

### Testability
- Unit tests: `ProjectRepository` (list, category filter, getBySlug success/not-found, QueryError paths) against `makeTestDatabase` stub — 6 tests, green
- `getProjectMeta` helper (`app/lib/project-meta.ts`) — 4 unit tests (year/stack[0]/role ordering, 3-token cap, empty-stack drop, year stringification)
- Effect Schema inputs — 6 unit tests (`app/lib/schemas/__tests__/project.test.ts`): happy decode + rejection per field
- feature-verifier browser walk → **PASS** — [`verifications/2026-07-21.md`](verifications/2026-07-21.md): 9/9 golden-path + 1/1 error-path assertions, 0 jsErrors, 0 networkErrors, screenshots in `screenshots/` (desktop 1440, mobile 390, hover, filter, empty-category)

## Key Files

| File | Role |
|------|------|
| `app/db/schema.ts` | `project` table (Drizzle) |
| `app/repositories/project.ts` | ProjectRepository — Effect.Service (`list`, `getBySlug`) |
| `app/repositories/__tests__/project.test.ts` | Unit tests |
| `app/lib/schemas/project.ts` | Effect Schema — `ListProjectsInput`, `GetProjectBySlugInput` (re-exported from `app/lib/schemas/index.ts`) |
| `app/lib/schemas/__tests__/project.test.ts` | Schema unit tests (6) |
| `app/runtime.ts` | `ProjectRepository.Default` wired into `AppServices`/`reposLayer` |
| `scripts/seed-preview.ts` | Seed fixtures (`PROJECT_FIXTURES`) |
| `app/trpc/routes/projects.ts` | tRPC router — `list`/`getBySlug`, both `publicProcedure`, via `runProcedure` |
| `app/trpc/router.ts` | `projectsRouter` registered as `projects` on the root `appRouter` |
| `app/routes.ts` | `/projects` + `:lng/projects` registered (mirrors home/login/sign-up convention) |
| `app/routes/projects/index.tsx` | `/projects` UI — loader calls `context.trpc.projects.list({})` (full unfiltered set), 2-col grid, filter pills via `?category=` search param (client + SSR shared), nav (wordmark/Projects/Marketplace/mailto CTA) |
| `app/components/macos-frame.tsx` | Reusable window-chrome card (dots + title bar) — shared with home hero (feat-007) + case study (feat-009) |
| `app/components/project-card.tsx` | Card component — thumbnail-in-`MacosFrame` (silver-mist fallback block + slug label when `thumbnailUrl` null), SF Mono meta row, `featured` prop → full-width horizontal layout |
| `app/lib/project-meta.ts` | `getProjectMeta` — pure helper building the `YEAR · STACK · ROLE` meta row (max 3 tokens, stack[0] only) |
| `app/locales/{en,zh}/projects.json` | i18n copy — `nav`, `title`, `count` (pluralized `_one`/`_other`), `filters.all`, `empty`. Category/stack/role tokens are data-driven and intentionally untranslated (same precedent as `home.tsx`'s `STACK` badges). |
| `app/app.css` | New fixed (non-dark-adaptive) portfolio tokens: `--canvas-mist`, `--carbon`, `--pure-white`, `--graphite`, `--pale-stone`, `--silver-mist` — see `rules/frontend.md` "Portfolio surface tokens" |

## Dependencies
- `Database` service (D1/Drizzle)
- Design spec: `.brain/high-level-architecture/design-language.md`
- shadcn primitives minimal — mostly custom monochrome styles

## Known gaps / deviations
- **`:lng/projects` doesn't actually translate.** `app/root.tsx`'s loader calls `i18nServer.getLocale(request)` (cookie/header detection only) — it never reads `params.lng`, so visiting `/zh/projects` renders English copy. This is a **pre-existing** gap shared by `/zh` (home), `/zh/login`, `/zh/sign-up` — not introduced by this task and out of scope for `add-route.md` (fixing the `:lng` param → locale wiring is a separate cross-cutting i18n task).
- Nav hides the `Projects`/`Marketplace` text links below `sm:` (matches `home.tsx`'s existing `hidden sm:inline-flex` precedent for the GitHub link) — the design spec's nav is written for desktop; without this, wordmark and first nav link visually collide at narrow widths because `justify-between` only distributes space between the two top-level flex children.
- CTA links to `mailto:sean@casperstudios.xyz` — no `/contact` page exists yet; reasonable default per "your call" in the task, not a documented spec requirement.

## Tagged Errors

| Error | Where raised | tRPC code |
|-------|--------------|-----------|
| `NotFoundError` | repo getBySlug | NOT_FOUND |

## Changelog

| Date | Type | Description |
|------|------|-------------|
| 2026-07-21 | feature | Post-verify hardening: schema unit tests (`app/lib/schemas/__tests__/project.test.ts`, effect-ts-enforcer finding), `project` re-exported from `app/lib/schemas/index.ts`, projects-count shows filtered length (feature-verifier finding). feature-verifier verdict PASS — `verifications/2026-07-21.md`. |
| 2026-07-22 | feature | UI shipped via `add-route.md` recipe (recipe-runner): `app/routes/projects/index.tsx` (`/projects` + `:lng/projects`), `app/components/macos-frame.tsx` (reusable, shared), `app/components/project-card.tsx`, `app/lib/project-meta.ts` (+4 unit tests), `projects` i18n namespace (en+zh), new fixed portfolio design tokens in `app/app.css` per `design-language.md`. Category filter via `?category=` search param, client + SSR shared filtering. Self-verified via throwaway Playwright script (screenshots, computed-style hover check, mobile viewport). Typecheck/test(238 passing)/build all green. Status left `in-progress` pending `verify-done-runner` + `feature-verifier` passes — those are separate hand-offs, not run by recipe-runner. See "Known gaps / deviations" above. |
| 2026-07-22 | feature | API layer shipped via `add-trpc-endpoint.md` recipe: `app/trpc/routes/projects.ts` (`list`, `getBySlug` — both `publicProcedure`), registered as `projects` on `appRouter` (`app/trpc/router.ts`). No new tagged error (`NotFoundError` already mapped). No new router-level test file — repo convention is repo-level tests only (`project.test.ts` already covers this). UI (`/projects` route, `project-card.tsx`) still pending — separate task. |
| 2026-07-21 | feature | Data layer shipped via `add-db-table.md` recipe: `project` table + migration, `ProjectRepository` (`list`/`getBySlug`), `app/lib/schemas/project.ts`, 6 unit tests, wired into `app/runtime.ts`, seed fixtures (4 projects). tRPC routes + UI still pending — separate task. |
| 2026-07-21 | feature | Planned — design research done, data model scoped |
