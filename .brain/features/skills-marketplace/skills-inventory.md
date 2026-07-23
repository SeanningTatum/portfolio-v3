# Skills Inventory — seed data for /marketplace

> Extracted 2026-07-21 from local repos; **pruned 2026-07-22** (user-directed
> decision, see below). Use as D1 seed source for the Skills Marketplace
> feature.

## Pruning decision (2026-07-22)

Only `github.com/SeanningTatum/marketplace` (marketplace name **"sean-skills"**)
counts as a real, publicly-installable marketplace for now. Verified via
`gh api repos/SeanningTatum/marketplace/contents/...` against the live repo —
it has exactly 2 plugins:

- **engineering-toolkit** (category `engineering`): 6 real skills —
  `client-review`, `create-pr-with-review`, `new-app`, `pr-format`, `release`,
  `resolve-comments` — plus `example-skill`, which is the starter template and
  is excluded from public display.
- **automation-toolkit**: contains only `example-skill` (the template) — 0
  real skills, so the plugin contributes nothing to the catalog.

The previously-seeded second marketplace, `seanningtatum-plugins`
(`github.com/SeanningTatum/claude-plugins` — 49 items across `cf-saas-stack`,
`dev-workflows`, and `project-management`), is **excluded entirely**. It isn't
wired up as an installable Claude Code marketplace the way `sean-skills` is,
so it doesn't belong in a catalog that's meant to show real, installable
tools. If/when that repo is published as a proper marketplace, re-add it as
its own pass (extend `SKILL_FIXTURES` in `scripts/seed-preview.ts`, don't
silently fold it back in).

**Net result: exactly 6 skills, all in `engineering-toolkit`, all type
`skill`, all category `engineering`.**

## Marketplace

**sean-skills** — repo `github.com/SeanningTatum/marketplace` — "Sean's
personal Claude Code plugins for SaaS engineering and automations."

Manifest: `.claude-plugin/marketplace.json` + per-plugin
`plugins/<name>/.claude-plugin/plugin.json`. Per-skill descriptions below are
taken verbatim from each skill's `SKILL.md` frontmatter (`gh api
repos/SeanningTatum/marketplace/contents/plugins/engineering-toolkit/skills/<skill>/SKILL.md`).

## Items

| Plugin | Item | Type | Description |
|---|---|---|---|
| engineering-toolkit | client-review | skill | Turn any HTML doc into a self-contained, offline commentable artifact for a client to review, then read their comments back as markdown for agents. |
| engineering-toolkit | create-pr-with-review | skill | Open a pull request that has already been through an AI review — runs the Greptile CLI, resolves findings by a P1/P2/P3 ruleset, then formats and creates the PR. |
| engineering-toolkit | new-app | skill | Scaffold a new application from the cf-saas-starter-react-router template — new GitHub repo, cloned locally, AGENTS.md seeded, then hand off to the setup wizard. |
| engineering-toolkit | pr-format | skill | Format PR descriptions for maximum readability using a fixed structure — WHY, WHAT, HOW, SOLUTION, VERIFICATION, CAVEATS, NEXT STEPS. |
| engineering-toolkit | release | skill | Ship a merged-ready PR as a versioned release: squash-merge, pick the next semver tag, and publish a GitHub release with marketing-grade notes. |
| engineering-toolkit | resolve-comments | skill | Read a GitHub PR's review comments and resolve them automatically where safe, triaging each by a P1/P2/P3 severity ruleset; re-triggers Greptile re-review. |

## Excluded (do not seed)

| Plugin/Repo | Item | Reason |
|---|---|---|
| engineering-toolkit | example-skill | Starter template placeholder |
| automation-toolkit | example-skill | Starter template placeholder — the plugin's only item |
| seanningtatum-plugins (github.com/SeanningTatum/claude-plugins) | all 49 items (cf-saas-stack skills/commands/agents, dev-workflows skills/commands/agents, project-management rule+hook) | Excluded 2026-07-22 — not a real installable marketplace for this catalog's purposes; see decision above |

## Category for /marketplace sidebar

- `engineering` — the only category currently populated (engineering-toolkit
  skills). Other category keys (`stack-conventions`, `commands`, `agents`,
  `workflow`) remain defined in i18n (`app/locales/{en,zh}/marketplace.json`)
  for when/if a second marketplace is re-added, but nothing seeds them today.
