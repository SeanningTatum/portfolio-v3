# Feature: Skills Marketplace

_Last updated: 2026-07-22_

## Purpose
`/marketplace` page displaying all Claude skills/plugins Sean has created agentically — 57 items across `sean-skills` and `seanningtatum-plugins` marketplaces. Seed data: `.brain/features/skills-marketplace/skills-inventory.md`. Spec: `.brain/high-level-architecture/design-language.md` (marketplace section).

## When It's Used
- Visitor navigates to /marketplace (public)
- Category sidebar filters; search field narrows

## How It Works
Loader calls tRPC `skills.list` (full unfiltered set — same pattern as /projects) → `SkillRepository.list()` over D1 `skill` table → two-column layout: sticky category text-list left with per-category counts (active `#111` 700; horizontal scroll row below `lg`), 3-col card grid right (`sm` 2-col, mobile 1-col). Card links out to the plugin's GitHub folder (`repoUrl`, new tab): type icon (tabler, per-type map) in 25px soft square, name 700, one-liner 500 clamp-2, SF Mono 800 footer (TYPE left / PLUGIN right) over hairline border; `NEW` badges SF Mono outline. Category filter = `?category=` search param; search = client-side state over name+description+plugin; sort dropdown A–Z / New-first. Carbon "Request a tool" banner (mailto) is the page's single surface inversion. `PortfolioNav` is path-aware — active section bold. i18n namespace `marketplace` (en+zh).

### Persistence details
- Storage: D1 table `skill`: id, slug, name, description, type (skill|command|agent|rule|hook), category, plugin, marketplaceRepo, repoUrl, isNew, sortOrder
- Seeded from skills-inventory.md via `scripts/seed-preview.ts` (exclude example-skill templates)

### Testability
- Unit tests: SkillRepository (list, filter by category/type)
- feature-verifier walk → `.brain/features/skills-marketplace/verifications/<date>.md`

## Key Files

| File | Role |
|------|------|
| `app/db/schema.ts` | `skill` table |
| `app/lib/schemas/skill.ts` | `SkillType`, `ListSkillsInput` — Effect Schema |
| `app/repositories/skill.ts` | SkillRepository — Effect.Service |
| `app/repositories/__tests__/skill.test.ts` | Unit tests |
| `app/trpc/routes/skills.ts` | tRPC router |
| `app/routes/marketplace/index.tsx` | /marketplace UI (route registered in `app/routes.ts`, root + `:lng`) |
| `app/components/portfolio-nav.tsx` | Shared nav — path-aware active link |
| `app/locales/{en,zh}/marketplace.json` | i18n namespace (registered in `app/i18n/i18n.ts` + `i18n.d.ts`) |
| `scripts/seed-preview.ts` | Seed 55 public items |

## Dependencies
- `Database` service
- skills-inventory.md (seed source)
- Design spec: design-language.md; refs: Kit App Store, Todoist Integrations

## Tagged Errors

| Error | Where raised | tRPC code |
|-------|--------------|-----------|
| `NotFoundError` | repo getBySlug (if detail added later) | NOT_FOUND |

## Changelog

| Date | Type | Description |
|------|------|-------------|
| 2026-07-22 | feature | UI shipped — `/marketplace` route (+`:lng`), sidebar/search/sort/cards/banner per spec; enforcer minors fixed (mono labels 800, icon radius 25px); feature-verifier PASS `verifications/2026-07-22.md` (7/7 golden + empty-search path, 0 js/network errors). |
| 2026-07-22 | feature | Data layer built — `skill` table, `SkillRepository`, `skills.list` tRPC procedure, 55-row seed verified. See `.brain/CHANGELOG.md` 2026-07-22 entry. |
| 2026-07-21 | feature | Planned — inventory extracted from both marketplace repos |
