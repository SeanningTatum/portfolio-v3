# Run: projects-markdown-refactor

_Started: 2026-07-22_
_Status: shipped_

## Task

Refactor /projects (feat-008) + /projects/:slug (feat-009) to read content from markdown files bundled at build time instead of the D1 `project` table; remove the project data layer (table, repo, tRPC router, seed fixtures).

## Domain

mixed (repository removal + routes + library)

## Plan

1. Add `content/projects/<slug>.md` files (frontmatter = project fields; body `## WHY` / `## HOW` / `## SOLUTION` sections) — port the 4 existing seed fixtures verbatim.
2. New pure lib: frontmatter parser + `import.meta.glob(..., { query: '?raw', eager: true })` content module, Effect Schema validation of frontmatter, unit tests. No fs, Workers-safe (bundled at build).
3. Rewire `app/routes/projects/index.tsx` + `$slug.tsx` loaders to the content module (drop tRPC calls). Keep UI/design identical.
4. Delete: `project` table from `app/db/schema.ts` (+ drop migration), `ProjectRepository` (+ tests), `app/trpc/routes/projects.ts`, `projects` from `appRouter`, `PROJECT_FIXTURES` from `scripts/seed-preview.ts`, `ProjectRepository` from `app/runtime.ts`. Keep `app/lib/schemas/project.ts` only if reused for frontmatter schema.
5. Verify: typecheck, tests, build; feature-verifier browser walk of /projects + /projects/:slug.
6. Brain updates: feature MDs (008, 009), data-models.md, api.md, rules cross-refs, CHANGELOG.

## Baseline

```
$ ./init.sh --baseline
typecheck:     PASS
test:          PASS (365 tests, 39 files)
harness-check: PASS (11/11)
```

Delegated to opus sub-agent; main thread verifies.

## Steps taken (sub-agent, 2026-07-22)

Followed the plan. Details:

1. **Content files** — created `content/projects/{portfolio-v3,cf-saas-starter,day-trader,home-karaoke}.md`, all fields ported verbatim from the old `PROJECT_FIXTURES`. Frontmatter = scalar/array fields (JSON syntax for `stack`/`stats`); body = `## WHY`/`## HOW`/`## SOLUTION` (only portfolio-v3 + cf-saas-starter have bodies; the other two are frontmatter-only).
2. **Lib** — `app/lib/content/frontmatter.ts` (pure `parseFrontmatter` + `parseSections`, no deps; values coerced via `JSON.parse` with bare-string fallback) + `app/lib/content/projects.ts` (`import.meta.glob(..., { query: "?raw", eager: true })`, validate each file against `ProjectContent` Effect Schema, sort featured-first then `sortOrder`; exposes `listProjects`/`getProjectBySlug`/`getAdjacentProjects`/`getCaseStudy`/`parseProjectFile`/`sortProjects`). Validation runs once at module load via `Effect.runSync` (fails loudly on bad content). New `ContentParseError` tagged error (`app/models/errors/content.ts`) added to the `AppError` union + `tagToTRPC` + effect-trpc test. `app/lib/schemas/project.ts` repurposed to `ProjectContent` (+ `ProjectStat`); old Input schemas removed.
3. **Loaders** — `index.tsx` → `listProjects()`, key changed `project.id` → `project.slug`; `$slug.tsx` → `getCaseStudy(slug)`, 404 on `undefined`, removed `@trpc/server` import + try/catch. UI otherwise untouched (pixel-identical). Component/helper `Project` type imports (`project-card.tsx`, `project-cover.tsx`, `project-meta.ts`) repointed to `ProjectContent`.
4. **Deleted D1 layer** — `project` table from `schema.ts` (+ types), drop migration `drizzle/0003_square_abomination.sql` generated & applied to local D1, `app/repositories/project.ts` + test, `app/trpc/routes/projects.ts`, `projects` from `router.ts`, `ProjectRepository` from `runtime.ts`, `PROJECT_FIXTURES` from `scripts/seed-preview.ts` (surgical Edits only — skill fixtures untouched; the file was concurrently modified by the marketplace agent and my edits applied cleanly around theirs).
5. **Tests** — new `app/lib/content/__tests__/{frontmatter,projects}.test.ts`; rewrote `app/lib/schemas/__tests__/project.test.ts` for `ProjectContent`; added `ContentParseError` case to `effect-trpc.test.ts`.
6. **Verify** — typecheck exit 0; `bun run test` 373/373 pass (was 365; -12 repo tests, +20 parser/content/schema/error tests); `bun run build` exit 0 (markdown bundled).
7. **Brain** — updated `data-models.md`, `api.md`, `rules/routes.md`, both feature docs, `CHANGELOG.md`, this run note.

**Deviations from plan:** none material. `rules/routes.md` "Loader not-found mapping" was updated (not in the enumerated brain list) because it named `$slug.tsx` as the canonical `TRPCError`-404 example, which would otherwise be stale — added the non-tRPC "branch on `undefined`" variant alongside the existing tRPC pattern.

**For the main thread to eyeball:** browser-verify `/projects` (grid, filter pills, featured full-width card) and `/projects/:slug` (meta grid, WHY/HOW/SOLUTION, stats, prev/next wrap-around, 404 on unknown slug) render pixel-identically to the pre-refactor D1 version. Not run here (per instructions). No commit made.

---

## Final

_Closed: 2026-07-22_

- Shipped: uncommitted (batch continues on user word)
- Brain docs updated: data-models.md, codebase/api.md, rules/routes.md, projects-showcase.md, project-case-study.md, CHANGELOG.md
- Verified on main thread: typecheck, 373 tests, build green; browser walk /projects (grid+pills+featured), /projects/portfolio-v3 (meta grid, WHY/HOW/SOLUTION, TOC, prev/next), unknown slug → 404 page; screenshots eyeballed, pixel-consistent with D1 version
- Left undone: none in scope. Pre-existing (not introduced): 404 ErrorBoundary nav renders center-jammed (wordmark collides with links) — separate cosmetic fix if desired
- Surprises worth remembering: ESM throwaway Playwright scripts must live in-repo (node resolves `playwright` from script path, not cwd)
