# Run: marketplace-prune-and-readme-prompt

_Started: 2026-07-22_
_Status: shipped_

## Task

Prune the marketplace catalog (feat-010) to only the skills that exist in github.com/SeanningTatum/marketplace (6 real skills in engineering-toolkit + automation-toolkit, example-skill templates excluded), deleting the other ~49 entries; plus author a reusable prompt for the marketplace repo that generates per-skill READMEs (WHAT / WHY / HOW + screenshots).

## Domain

repository (seed data) + brain

## Plan

1. Fetch the 6 skills' SKILL.md frontmatter from SeanningTatum/marketplace for names/descriptions.
2. Replace `SKILL_FIXTURES` (or equivalent) in `scripts/seed-preview.ts` with only those 6, `marketplaceRepo`/`repoUrl` pointing at SeanningTatum/marketplace. Edit-only on that file (projects refactor removes PROJECT_FIXTURES concurrently).
3. Re-seed local D1; verify /marketplace shows exactly 6.
4. Update `.brain/features/skills-marketplace/skills-inventory.md` + `skills-marketplace.md` (counts, repos).
5. README-generation prompt → deliverable file the user can drop into the marketplace repo (WHAT/WHY/HOW + screenshots convention).
6. Verify: tests, typecheck; browser check of /marketplace.

## Baseline

```
$ ./init.sh --baseline
typecheck:     PASS
test:          PASS (365 tests, 39 files)
harness-check: PASS (11/11)
```

Delegated to sonnet sub-agents; main thread verifies.

## Progress — marketplace prune (sub-agent, 2026-07-22)

Steps 1-4 of the plan done:

1. Fetched all 6 `engineering-toolkit` SKILL.md files from `SeanningTatum/marketplace`
   via `gh api` for accurate name/description text.
2. Replaced `SKILL_FIXTURES` in `scripts/seed-preview.ts` (surgical `Edit`, not a
   rewrite — `PROJECT_FIXTURES` untouched) with exactly the 6 real skills:
   `client-review`, `create-pr-with-review`, `new-app`, `pr-format`, `release`,
   `resolve-comments`. All `category: "engineering"`, `plugin:
   "engineering-toolkit"`, `marketplaceRepo: "SeanningTatum/marketplace"`,
   `repoUrl` pointing at the exact skill subfolder
   (`.../plugins/engineering-toolkit/skills/<skill>`). Removed the now-unused
   `CLAUDE_PLUGINS_REPO_URL` constant; renamed `MARKETPLACE_REPO_URL` →
   `MARKETPLACE_SKILLS_URL` pointing straight at the skills dir.
3. Cleared local D1 `skill` table (`wrangler d1 execute portfolio-v3-db --local
   --command "DELETE FROM skill;"` — `INSERT OR IGNORE` alone would not have
   removed the stale 49 rows) then ran `bun run db:seed`. Verified row count = 6
   and spot-checked all 6 rows (slug/name/category/plugin/marketplace_repo/
   repo_url/is_new/sort_order) via `wrangler d1 execute --local`.
4. `bun run typecheck` clean; `bun run test` → 365/365 passed, 39 files
   (including `app/repositories/__tests__/skill.test.ts`, which uses its own
   inline stub fixtures and needed no changes).

Brain updated: `skills-inventory.md` rewritten (decision record + pruned
table); `skills-marketplace.md` Purpose/Persistence/Key Files/Changelog
updated.

Not done (out of this sub-agent's scope, per parent task instructions): the
README-generation prompt deliverable (plan step 5) and browser verification of
`/marketplace` (plan step 6) — main thread to handle. Projects feature
(`PROJECT_FIXTURES`, `app/routes/projects/**`, `app/repositories/project.ts`)
was not touched.

## Progress

- README-generation prompt written to `.brain/features/skills-marketplace/readme-generation-prompt.md` — self-contained prompt (usable as a slash command or pasted directly) that has a future agent in the marketplace repo write a WHAT/WHY/HOW/Screenshots README.md per non-template skill, grounded on `pr-format` and `resolve-comments` SKILL.md content, ending with a consolidated missing-screenshot shot list.

---

## Final

_Closed: 2026-07-22_

- Shipped: uncommitted (batch continues on user word)
- Brain docs updated: skills-inventory.md (rewritten, pruning decision recorded), skills-marketplace.md, readme-generation-prompt.md (new)
- Verified on main thread: typecheck + 373 tests green; /marketplace browser-walked + screenshot eyeballed — exactly 6 tools, Engineering category (6), NEW badges, banner intact
- Left undone: remote/preview D1 still holds the old 55 rows — run `bun run db:seed:preview` (and prod equivalent) after clearing `skill` table on deploy; README prompt still needs Sean to copy it into the marketplace repo and run it
