# Run: project-case-study

_Started: 2026-07-21_
_Status: shipped_

## Task

Build feat-009: `/projects/:slug` case-study page — WHY / HOW / SOLUTION reading column with sticky SF Mono TOC, meta grid (CLIENT/ROLE/STACK/YEAR), stats row, prev/next footer. Server surface already exists (feat-008: `projects.getBySlug`, case-study fields on `project` table).

## Domain

mixed (routes + frontend; repository extension for prev/next)

## Plan

1. Repository: add `getAdjacent(slug)` (prev/next by sortOrder/featured ordering) to ProjectRepository + unit tests; expose via tRPC (extend `projects` router — new procedure or fold into getBySlug payload).
2. `add-route.md`: `/projects/:slug` + `:lng` variant — loader via `projects.getBySlug`, 404 on NotFoundError per repo convention; UI per design-language.md case-study section (680px column, SF Mono eyebrows `01 — WHY`, meta grid, stats row from statsJson, macos-frame hero image, prev/next footer, pull-quote style if used).
3. i18n `caseStudy` (or extend `projects`) namespace en+zh.
4. Verify: enforcer + feature-verifier (golden: seeded `portfolio-v3` slug renders all sections; error: unknown slug → 404) + verify-done-runner.
5. Brain: api.md (if router extended), feature MD, CHANGELOG, run note close.

## Baseline

```
$ ./init.sh --baseline
Baseline green. Proceed to task.
(typecheck PASS, 244 tests PASS, harness-check 11/11)
```

---

## Progress

### Step 1 — Repository: `ProjectRepository.getAdjacent` — DONE
- `app/repositories/project.ts`: `getAdjacent(input)` — prev/next `{ slug, title }` ordered `featured DESC, sortOrder ASC` (same as `list`), wraps around at either end (design call — not spec'd in `design-language.md`), `{ prev: null, next: null }` for an unknown slug or single-project catalog.
- `app/repositories/__tests__/project.test.ts`: +6 tests (middle, wrap first→last, wrap last→first, single-project, missing-slug, QueryError).

### Step 2 — tRPC: `projects.getCaseStudy` — DONE
- `app/trpc/routes/projects.ts`: new `getCaseStudy` procedure composing `getBySlug` + `getAdjacent` → `{ project, prev, next }`. Chose a new procedure over widening `getBySlug` (list page's card-grid caller stays unaffected; repo keeps one query per method).
- `.brain/codebase/api.md` route table updated.

### Step 3 — Route `/projects/:slug` (add-route.md) — DONE
- `app/routes/projects/$slug.tsx`: loader → `context.trpc.projects.getCaseStudy`; catches `TRPCError({code:"NOT_FOUND"})` (server-side caller, not `TRPCClientError`) → throws `Response` 404; page-level `ErrorBoundary` (design-consistent 404 + back-to-projects link, re-throws non-404 to root).
- Layout: title block, SF Mono meta grid (CLIENT/ROLE/STACK/YEAR, CLIENT omitted gracefully), hero image (`MacosFrame`, silver-mist fallback), WHY/HOW/SOLUTION reading column + sticky TOC (sections skipped when field null), stats row (only when `statsJson` non-empty), prev/next footer.
- Registered `/projects/:slug` + `:lng/projects/:slug` in `app/routes.ts`.
- Extracted `app/components/portfolio-nav.tsx` (`PortfolioNav`) from `routes/projects/index.tsx`'s inline `TopNav` — byte-identical markup/testids, shared by both pages.
- New `splitParagraphs` helper (`app/lib/utils.ts`, +6 tests) — blank-line paragraph split, no markdown parser.
- data-testids added: `case-study-title`, `case-study-meta`, `case-study-why/how/solution`, `case-study-stats`, `case-study-prev/next`, `case-study-toc`, `case-study-not-found-title`, `case-study-back-to-projects`.

### Step 4 — i18n — DONE
- `app/locales/{en,zh}/projects.json`: new `caseStudy.{prev,next,notFound.{title,message,back}}` keys.
- Decision: SF Mono eyebrow/meta-grid labels (`CLIENT`/`ROLE`/`STACK`/`YEAR`, `01 — WHY`/etc) kept as hardcoded English design tokens, not i18n keys — same precedent as untranslated STACK/category tokens on `/projects`.

### Step 5 — Quality gates — DONE
```
$ bun run typecheck   → exit 0, no errors
$ bun run test        → 26 files, 256 tests passed (244 → 256)
$ bun run build       → client + server build succeeded (pre-existing sourcemap warnings on unrelated ui/ files, not build errors)
$ bash scripts/harness-check.sh → 11/11 passed
```

### Step 6 — Brain updates — DONE
- `.brain/codebase/api.md`, `.brain/features/project-case-study/project-case-study.md` (How It Works, Key Files, Decisions, Changelog), `.brain/CHANGELOG.md`, this run note.
- No `scripts/seed-preview.ts` change needed — case-study fields already seeded in feat-008; this feature adds no new table/user-visible data, only a new read path over existing data.

### Outstanding (next agent)
- `verify-done-runner` full `99-verify-done.md` pass (not run by recipe-runner per its own rules).
- `feature-verifier` browser walk: golden path (seeded `portfolio-v3` slug — all sections + stats + prev/next render), one null-field path (`day-trader`/`home-karaoke` — sections/stats/CLIENT gracefully omitted), error path (unknown slug → 404 page with back-to-projects link). Verdict doc → `.brain/features/project-case-study/verifications/<date>.md`.
- `feature_list.json` status flip to `shipped` belongs to `/ship-feature`, not this task — left `in-progress`.

_Status: shipped_

## Final

_Closed: 2026-07-21_

- Shipped: feat-009 (uncommitted — repo has no commits yet)
- Verification: verify-done PASS (typecheck / 268 tests / e2e retry-green — same documented cold-start flake / build); feature-verifier PASS `verifications/2026-07-21.md` (golden 8/8, null-field, 404 + back link); enforcer major resolved by codifying "Loader not-found mapping" in `rules/routes.md` (loader + in-process tRPC caller → TRPCError instanceof + 404 Response is now documented convention, $slug.tsx canonical); minor accepted (root ErrorBoundary confirmed rendering Error instances)
- Brain docs updated: api.md (getCaseStudy), i18n.md (caseStudy.* keys), rules/routes.md, feature MD + verification link, CHANGELOG, feature_list → shipped
- Left undone: none feature-scoped. Repo-wide known gap remains: `:lng` routes don't translate (pre-existing)
- Surprises worth remembering: in-process tRPC caller throws TRPCError (never TRPCClientError) — loader catch must match on TRPCError; prev/next wrap-around chosen (footer never dead-ends)
