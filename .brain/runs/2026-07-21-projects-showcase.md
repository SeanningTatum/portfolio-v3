# Run: projects-showcase

_Started: 2026-07-21_
_Status: shipped_

## Task

Build feat-008: public `/projects` page — D1 `project` table + ProjectRepository + tRPC `projects.list`/`getBySlug` + minimalist 2-col card grid per design-language.md. Establishes the project data model feat-009 (case study) reads from.

## Domain

mixed (repository + routes + frontend)

## Plan

1. `add-db-table.md`: `project` table in `database/schema.ts` (incl. case-study fields for feat-009: why/how/solution/statsJson/client/heroImageUrl), migration, ProjectRepository (Effect.Service) + unit tests, seed fixtures in `scripts/seed-preview.ts`.
2. `add-tagged-error.md`: reuse existing `NotFoundError` if present; else add + map in `tagToTRPC`.
3. `add-trpc-endpoint.md`: `projects.list` (public, optional category filter) + `projects.getBySlug`.
4. `add-route.md`: `/projects` route — loader, grid UI, filter pills, macOS-chrome card component (shared `macos-frame.tsx`), i18n namespace.
5. Verify: typecheck + unit + build; feature-verifier browser walk → verifications doc.
6. Brain updates: data-models.md, api.md, routes.md, repository.md, feature MD, CHANGELOG.

## Baseline

```
$ ./init.sh --baseline
typecheck:     PASS
test:          PASS (23 files, 228 tests)
harness-check: FAIL → fixed pre-work (4 missing feature docs created), now 11/11 PASS
```

Tree state: fresh scaffold from cf-saas-starter-react-router, post `bun setup`, no commits yet.

---

## Step 1 — persistence layer (delegated: recipe-runner, add-db-table.md)

_2026-07-21 ~19:30_

What I did: delegated `project` table + repository to recipe-runner.

Result: `app/db/schema.ts` project table (note: real convention `app/db/schema.ts`, NOT `database/schema.ts` from recipe example); migration `drizzle/0001_funny_doctor_strange.sql` applied local; `app/repositories/project.ts` (list w/ category filter ordered featured desc→sortOrder asc, getBySlug via `requireFound` → existing `NotFoundError`, no new error needed); `app/lib/schemas/project.ts`; wired into `app/runtime.ts`; 6 unit tests; `scripts/seed-preview.ts` +4 fixtures (idempotent, verified twice).

```
Test Files  24 passed (24)
     Tests  234 passed (234)
```

Learned: seed script has `--describe` mode for PR sticky comments; `requireFound` helper exists for not-found mapping.

Next: tRPC router (step 2, delegated).

---

## Step 2 — tRPC router (delegated: recipe-runner, add-trpc-endpoint.md)

_2026-07-21 ~19:35_

Result: `app/trpc/routes/projects.ts` — `list` + `getBySlug`, both publicProcedure via `Schema.standardSchemaV1` + runProcedure; registered in `app/trpc/router.ts`; api.md + CHANGELOG + feature MD updated. No router-level tests — zero precedent in codebase (repo-layer tests only, convention confirmed vs admin.ts/analytics.ts). No new tagged errors (NotFoundError reused).

```
Test Files  24 passed (24)
     Tests  234 passed (234)
typecheck exit 0
```

Next: /projects UI (step 3, delegated) — macos-frame.tsx + project-card.tsx + route per design-language.md.

---

## Step 3 — /projects UI (delegated: recipe-runner, add-route.md)

_2026-07-22_

What I did: delegated the front-end layer to recipe-runner. New baseline re-run at start (typecheck/test/harness-check all PASS, no pre-existing failures).

Result:
- `app/components/macos-frame.tsx` — reusable window-chrome card (dots + title bar), generic `children`/`title` props, shared with feat-007/feat-009.
- `app/components/project-card.tsx` + `app/lib/project-meta.ts` (`getProjectMeta`, +4 unit tests — pure helper, testable, unlike the rest of the presentational component).
- `app/routes/projects/index.tsx` registered as `/projects` + `:lng/projects` in `app/routes.ts`. Loader → `context.trpc.projects.list({})` (full set); category filter via `?category=` search param (client + SSR shared, no second query).
- New fixed portfolio design tokens in `app/app.css` (`--canvas-mist`/`--carbon`/`--pure-white`/`--graphite`/`--pale-stone`/`--silver-mist`) — deliberately **not** dark-mode-adaptive, since `design-language.md`'s palette is a fixed monochrome system distinct from the SaaS-shell semantic vars. Documented in `rules/frontend.md`.
- `projects` i18n namespace (en+zh) registered in `i18n.ts` namespaces + `i18n.d.ts` CustomTypeOptions.

Verification: throwaway Playwright script (screenshots at desktop 1440px + mobile 390px, filter-pill click + direct `?category=` nav, hover computed-style check confirming border → `rgb(17,17,17)` = `#111`). Caught + fixed a real mobile bug: nav wordmark visually collided with the first nav link at 390px because `justify-between` only distributes space between the header's two top-level flex children — fixed by hiding the `Projects`/`Marketplace` text links below `sm:` (same pattern as `home.tsx`'s GitHub link).

Also surfaced (did not fix, out of scope): `/zh/projects` doesn't translate — `app/root.tsx` loader never reads `params.lng`, cookie/header-only detection. Confirmed this is pre-existing by testing `/zh` (home) — same bug there too.

```
typecheck: PASS
Test Files  25 passed (25)
     Tests  238 passed (238)
build: PASS (client + server, exit 0)
```

Next: hand off to verify-done-runner for the full 99-verify-done.md pass, then feature-verifier for a browser-walk verdict doc, before `/ship-feature` flips feat-008 to shipped.

---

## Final

_Closed: 2026-07-21_

- Shipped: feat-008 (uncommitted — repo has no commits yet; first commit pending)
- Verification: verify-done PASS (typecheck / 244 tests / e2e smoke — first-run cold-start flake on auth.spec, clean on retry, unrelated to diff / build); feature-verifier PASS `verifications/2026-07-21.md`; effect-ts-enforcer findings fixed (schema tests + `index.ts` re-export); verifier count nit fixed (filtered length)
- Brain docs updated: data-models.md, api.md, i18n.md (projects namespace), rules/frontend.md (portfolio tokens + macos-frame), feature MD, CHANGELOG, feature_list.json → shipped
- Left undone: `:lng` locale routes don't translate (pre-existing — root.tsx loader ignores params.lng, affects /zh home too) — separate follow-up task; /projects/:slug 404s until feat-009
- Surprises worth remembering: schema files need co-located tests + index re-export (enforcer caught); e2e auth spec flaky on cold dev-server start
