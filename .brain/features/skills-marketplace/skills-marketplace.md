# Feature: Skills Marketplace

_Last updated: 2026-07-21_

## Purpose
`/marketplace` page displaying all Claude skills/plugins Sean has created agentically — 57 items across `sean-skills` and `seanningtatum-plugins` marketplaces. Seed data: `.brain/features/skills-marketplace/skills-inventory.md`. Spec: `.brain/high-level-architecture/design-language.md` (marketplace section).

## When It's Used
- Visitor navigates to /marketplace (public)
- Category sidebar filters; search field narrows

## How It Works
Loader calls tRPC `skills.list` → `SkillRepository.list()` over D1 `skill` table → two-column layout: sticky category text-list left (active `#111` 700), 3-col card grid right. Card: icon in 25px soft square, name 700, one-liner 500, SF Mono footer (TYPE / CATEGORY) with hairline top border, `NEW` badges as SF Mono outline. Search client-side or via query param.

### Persistence details
- Storage: D1 table `skill`: id, slug, name, description, type (skill|command|agent|rule|hook), category, plugin, marketplaceRepo, repoUrl, isNew, sortOrder
- Seeded from skills-inventory.md via `scripts/seed-preview.ts` (exclude example-skill templates)

### Testability
- Unit tests: SkillRepository (list, filter by category/type)
- feature-verifier walk → `.brain/features/skills-marketplace/verifications/<date>.md`

## Key Files

| File | Role |
|------|------|
| `database/schema.ts` | `skill` table |
| `app/repositories/skill.ts` | SkillRepository — Effect.Service |
| `app/repositories/__tests__/skill.test.ts` | Unit tests |
| `app/trpc/routes/skills.ts` | tRPC router |
| `app/routes/marketplace/index.tsx` | /marketplace UI |
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
| 2026-07-21 | feature | Planned — inventory extracted from both marketplace repos |
