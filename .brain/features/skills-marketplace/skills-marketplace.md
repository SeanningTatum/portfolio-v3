# Feature: Skills Marketplace

_Last updated: 2026-07-23_

## Purpose
`/marketplace` page displaying Claude skills Sean has created agentically — 8 real skills (6 `engineering-toolkit` + 2 `marketing-toolkit`) in the `sean-skills` marketplace (`github.com/SeanningTatum/marketplace`). Pruned 2026-07-22 (user-directed) from an earlier 55-item catalog that also included the unpublished `seanningtatum-plugins` repo — see `.brain/features/skills-marketplace/skills-inventory.md` for the decision record. Seed data: `.brain/features/skills-marketplace/skills-inventory.md`. Spec: `.brain/high-level-architecture/design-language.md` (marketplace section).

## When It's Used
- Visitor navigates to /marketplace (public)
- Category sidebar filters; search field narrows

## How It Works
Loader calls `listSkills()` directly (bundled markdown — same pattern as /projects, no tRPC, no `context`) → two-column layout: sticky category text-list left with per-category counts (active `#111` 700; horizontal scroll row below `lg`), 3-col card grid right (`sm` 2-col, mobile 1-col). Card links out to the plugin's GitHub folder (`repoUrl`, new tab): type icon (tabler, per-type map) in 25px soft square, name 700, one-liner 500 clamp-2, SF Mono 800 footer (TYPE left / PLUGIN right) over hairline border; `NEW` badges SF Mono outline. Category filter = `?category=` search param; search = client-side state over name+description+plugin; sort dropdown A–Z / New-first. Carbon "Request a tool" banner (mailto) is the page's single surface inversion. `PortfolioNav` is path-aware — active section bold. i18n namespace `marketplace` (en+zh).

### Content details (markdown, not D1)
- Storage: one `content/skills/<slug>.md` file per skill, bundled at build via `import.meta.glob("...", { query: "?raw", eager: true })` — Workers-safe, no `fs`, no DB. All fields are frontmatter (no `##` body): `slug`, `name`, `description`, `type` (skill|command|agent|rule|hook), `category`, `plugin`, `repoUrl`, `isNew`, `sortOrder`.
- Parsed + validated once at module load against the `SkillContent` Effect Schema; a malformed file fails loudly with `ContentParseError`.
- As of 2026-07-23, 8 files (6 `engineering-toolkit` + 2 `marketing-toolkit`, all from `SeanningTatum/marketplace`); `example-skill` templates and the entire `seanningtatum-plugins` repo are excluded (see skills-inventory.md pruning decision).

### Testability
- Unit tests: `app/lib/content/__tests__/skills.test.ts` (parse/sort/bundled-content) + `app/lib/schemas/__tests__/skill.test.ts` (`SkillType`, `SkillContent`)
- feature-verifier walk → `.brain/features/skills-marketplace/verifications/<date>.md`

## Key Files

| File | Role |
|------|------|
| `content/skills/*.md` | Skill content (8 files) — frontmatter only |
| `app/lib/content/skills.ts` | `listSkills()` — glob + parse + validate + sort |
| `app/lib/content/frontmatter.ts` | Shared pure frontmatter parser |
| `app/lib/schemas/skill.ts` | `SkillType`, `SkillContent` — Effect Schema |
| `app/lib/content/__tests__/skills.test.ts` | Unit tests |
| `app/models/errors/content.ts` | `ContentParseError` (shared with projects, mapped in `tagToTRPC`) |
| `app/routes/marketplace/index.tsx` | /marketplace UI (route registered in `app/routes.ts`, root + `:lng`) |
| `app/components/portfolio-nav.tsx` | Shared nav — path-aware active link |
| `app/locales/{en,zh}/marketplace.json` | i18n namespace (registered in `app/i18n/i18n.ts` + `i18n.d.ts`) |

## Dependencies
- Bundled markdown (`content/skills/*.md`) — no `Database` service, no D1
- skills-inventory.md (content source)
- Design spec: design-language.md; refs: Kit App Store, Todoist Integrations

## Tagged Errors

| Error | Where raised | tRPC code |
|-------|--------------|-----------|
| `NotFoundError` | repo getBySlug (if detail added later) | NOT_FOUND |

## Changelog

| Date | Type | Description |
|------|------|-------------|
| 2026-07-23 | content | Added `readme-marketing-rewrite` skill — 2nd `marketing-toolkit` item (fetched live from `SeanningTatum/marketplace` GitHub API). New `content/skills/readme-marketing-rewrite.md` (sortOrder 7, `isNew`). Marketplace now 8 tools, Marketing 2. Screenshot-verified: card renders with NEW badge + `SKILL / MARKETING-TOOLKIT` footer, 0 console errors; typecheck + skills tests green. |
| 2026-07-23 | refactor | **Moved marketplace off D1 to bundled markdown** (mirrors the projects refactor). `/marketplace` loader now calls `listSkills()` directly — no tRPC, no `context`. New `content/skills/*.md` (7 files, frontmatter-only, ported verbatim from `SKILL_FIXTURES`), content module `app/lib/content/skills.ts` (glob + shared `frontmatter.ts` parser + `SkillContent` Effect Schema, validated at module load, `ContentParseError` on bad file). **Deleted**: `skill` D1 table (drop migration `drizzle/0004_public_korath.sql`), `app/repositories/skill.ts` + test, `app/trpc/routes/skills.ts`, `skills` from `appRouter`, `SkillRepository` from `runtime.ts`, `SKILL_FIXTURES`/`SkillFixture` + skill INSERT loop from `seed-preview.ts`, `ListSkillsInput` schema (replaced by `SkillContent`). UI pixel-identical (`SkillCard` prop `Skill` → `SkillContent`, `key` id → slug). enforcer clean (5/5 non-negotiables); typecheck + 375 tests + build green; screenshot-verified `/marketplace` (7 tools, Engineering 6 / Marketing 1, A–Z + category filter, 0 console errors). |
| 2026-07-23 | content | Added `mockup-screenshot` skill (new `marketing-toolkit` plugin, PR SeanningTatum/marketplace#10) — 7th `SKILL_FIXTURES` row, new `marketing` category (i18n en `Marketing` / zh `营销`). Local D1 re-seeded (7 rows, `marketing` count 1). Screenshot-verified `/marketplace`: sidebar shows Engineering 6 / Marketing 1, card renders with NEW badge + `SKILL / MARKETING-TOOLKIT` footer, 0 console errors. `typecheck` green. |
| 2026-07-22 | prune | Catalog pruned to only what actually exists in `github.com/SeanningTatum/marketplace` (user-directed): `SKILL_FIXTURES` in `scripts/seed-preview.ts` cut from 55 rows to exactly 6 — all `engineering-toolkit` skills (`client-review`, `create-pr-with-review`, `new-app`, `pr-format`, `release`, `resolve-comments`); the entire `seanningtatum-plugins` catalog and both `example-skill` templates removed. Local D1 `skill` table cleared and re-seeded (verified 6 rows). `skills-inventory.md` rewritten with the decision record. `typecheck` + `test` (365/365) green. |
| 2026-07-22 | feature | UI shipped — `/marketplace` route (+`:lng`), sidebar/search/sort/cards/banner per spec; enforcer minors fixed (mono labels 800, icon radius 25px); feature-verifier PASS `verifications/2026-07-22.md` (7/7 golden + empty-search path, 0 js/network errors). |
| 2026-07-22 | feature | Data layer built — `skill` table, `SkillRepository`, `skills.list` tRPC procedure, 55-row seed verified. See `.brain/CHANGELOG.md` 2026-07-22 entry. |
| 2026-07-21 | feature | Planned — inventory extracted from both marketplace repos |
