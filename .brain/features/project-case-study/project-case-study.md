# Feature: Project Case Study

_Last updated: 2026-07-21_

## Purpose
`/projects/:slug` detail page telling each project's problem-solving story via WHY / HOW / SOLUTION sections — demonstrates Sean's problem-solving skills. Spec: `.brain/high-level-architecture/design-language.md` (case study section).

## When It's Used
- Visitor clicks a project card on /projects
- Prev/next footer navigates between case studies

## How It Works
Loader calls `getCaseStudy(params.slug)` from `app/lib/content/projects.ts` (no tRPC, no `context`) → returns `{ project, prev, next }` (prev/next `{ slug, title } | null`, same featured-first-then-`sortOrder` ordering as the list, wraps around at either end), or `undefined` for an unknown slug → renders: shared `PortfolioNav`, title block (headline 800 + outcome sentence = `project.summary`), SF Mono meta grid (CLIENT/ROLE/STACK/YEAR — CLIENT column omitted when `client` is null, grid narrows from 4 to 3 cols rather than leaving an empty cell), hero image in macOS-chrome card (silver-mist fallback with slug label when `heroImageUrl` is null, same pattern as `ProjectCard`), WHY/HOW/SOLUTION sections in a `max-w-[680px]` reading column with a sticky SF Mono TOC on `lg+` (`01 — WHY` / `02 — HOW` / `03 — SOLUTION` — sections with a null/absent field are skipped entirely, TOC only lists present sections), stats row from `statsJson` (numbers 800, SF Mono captions, only rendered when non-empty), prev/next footer (hairline border-top, arrow icons). When `getCaseStudy` returns `undefined` the loader throws `new Response("Not Found", { status: 404 })`; the route exports its own `ErrorBoundary` for a design-consistent 404 (nav + message + back-to-projects link) rather than falling through to root's generic boundary, re-throwing anything that isn't its own 404 case.

> **2026-07-22 refactor:** this page now reads bundled markdown, not the D1 `project` table via tRPC `projects.getCaseStudy`. `getBySlug`/`getAdjacent` semantics are preserved in `app/lib/content/projects.ts` (`getProjectBySlug` / `getAdjacentProjects`). The 404 is now a plain "content module returned `undefined`" branch instead of a caught `TRPCError`; behaviour (throw-a-Response + on-brand `ErrorBoundary`) is unchanged.

### Design decisions
- **Eyebrow/subhead labels are hardcoded English design tokens, not i18n keys** — `CLIENT`/`ROLE`/`STACK`/`YEAR` and `01 — WHY`/`02 — HOW`/`03 — SOLUTION` are treated the same as the untranslated STACK/category tokens in `/projects` (`codebase/i18n.md`): fixed SF Mono visual-identity elements, not user copy. Genuine copy (prev/next labels, 404 title/message/back-link) is translated via the `projects` namespace `caseStudy.*` keys, en + zh.
- **No dedicated subhead field** — schema only has `why`/`how`/`solution` body text, no separate subhead copy. Subhead renders as the title-cased eyebrow (`Why`/`How`/`Solution`). Revisit if a future case study wants a distinct subhead sentence.
- **`getCaseStudy` is a new procedure, not a `getBySlug` extension** — keeps the list page's card-grid caller (`getBySlug`, unchanged shape) decoupled from the detail page's project+prev+next payload; composed in the tRPC route handler, not the repository, so `ProjectRepository` keeps one query per method.
- **Prev/next wrap around** — not spec'd either way in `design-language.md`; chose wrap-around so the footer is always navigable instead of dead-ending at either end of the ordered list.
- **`PortfolioNav` extracted** from `routes/projects/index.tsx` into `app/components/portfolio-nav.tsx` — the case-study page needed byte-identical nav markup; trivial extraction, no behavior change, same `data-testid`s preserved.
- **Seed data note**: current `scripts/seed-preview.ts` why/how/solution strings are single-paragraph — `splitParagraphs` (blank-line split, no markdown) is exercised by unit tests but the seeded golden path only renders one `<p>` per section. No seed change needed (no new table/user-visible data added by this feature — case-study fields already seeded in feat-008).

### Persistence details
- Same bundled markdown source as feat-008 (`content/projects/*.md`). Case-study fields: `why`/`how`/`solution` come from the body's `## WHY` / `## HOW` / `## SOLUTION` sections (plain text, paragraphs still split on blank lines via `splitParagraphs` — no markdown rendering); `client`/`heroImageUrl`/`stats` from frontmatter. All optional — a project with no body sections renders as a bare card with no case-study detail.

### Testability
- `ProjectRepository.getBySlug` covered in feat-008 tests; `getAdjacent` covered by 6 new tests (middle, wrap-around both ends, single-project, missing-slug, QueryError) in `app/repositories/__tests__/project.test.ts`
- `splitParagraphs` helper covered by 6 new tests in `app/lib/__tests__/utils.test.ts`
- feature-verifier walk → **PASS** — [`verifications/2026-07-21.md`](verifications/2026-07-21.md): 8/8 golden path, null-field path (day-trader), 404 error path + back link, 0 jsErrors/networkErrors, screenshots in `screenshots/`

## Key Files

| File | Role |
|------|------|
| `app/routes/projects/$slug.tsx` | Detail UI — loader calls `getCaseStudy(slug)`, sections, prev/next footer, 404 `ErrorBoundary` |
| `app/lib/content/projects.ts` | `getCaseStudy` / `getProjectBySlug` / `getAdjacentProjects` (prev/next, wrap-around) |
| `content/projects/*.md` | Case-study body (`## WHY`/`## HOW`/`## SOLUTION`) + frontmatter fields |
| `app/components/macos-frame.tsx` | Shared window-chrome media card (hero image) |
| `app/components/portfolio-nav.tsx` | Shared slim nav (extracted from `/projects` index this feature) |
| `app/lib/utils.ts` | `splitParagraphs` — blank-line paragraph split for WHY/HOW/SOLUTION body text |
| `app/locales/{en,zh}/projects.json` | `caseStudy.*` keys (prev/next labels, 404 copy) |

## Dependencies
- feat-008 (bundled-markdown content module — `content/projects/*.md` + `app/lib/content/projects.ts`)
- Design spec: design-language.md

## Tagged Errors

| Error | Where raised | tRPC code |
|-------|--------------|-----------|
| (none) | `getCaseStudy` returns `undefined` for an unknown slug → loader throws a 404 `Response` (no tagged error in this path) | — |

## Changelog

| Date | Type | Description |
|------|------|-------------|
| 2026-07-22 | refactor | **Moved off D1/tRPC to bundled markdown** (with feat-008). Loader now calls `getCaseStudy(slug)` from `app/lib/content/projects.ts` and 404s on `undefined`; removed the `TRPCError` catch + `@trpc/server` import from `$slug.tsx`. `getBySlug`/`getAdjacent` (incl. wrap-around) preserved as pure content-module functions with unit tests. UI unchanged (pixel-identical). typecheck + 373 tests + build green. Status left `in-progress` pending main-thread browser verification. |
| 2026-07-21 | feature | Shipped — verify-done PASS (typecheck, 268 tests, e2e retry-green, build), feature-verifier PASS (`verifications/2026-07-21.md`), enforcer findings resolved (loader not-found pattern codified in `rules/routes.md`). |
| 2026-07-21 | feature | Planned — refs: Resend Handbook, Medium, Enode |
| 2026-07-21 | feature | Implemented `/projects/:slug` case-study page: `ProjectRepository.getAdjacent` (+ 6 tests), tRPC `projects.getCaseStudy`, route `app/routes/projects/$slug.tsx` (loader + 404 `ErrorBoundary`), extracted `PortfolioNav`, `splitParagraphs` helper (+ 6 tests), `caseStudy.*` i18n en/zh. typecheck + 256 tests (244 → 256) + build all green. Pending: feature-verifier browser walk. |
