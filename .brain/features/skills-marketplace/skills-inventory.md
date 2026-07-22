# Skills Inventory — seed data for /marketplace

> Extracted 2026-07-21 from local repos. Use as D1 seed source for the Skills Marketplace feature.
> Only items authored by Sean (SeanningTatum). Excluded: caveman (Julius Brussee), casper-studios/* (company).

## Marketplaces

1. **sean-skills** — repo `github.com/SeanningTatum/marketplace` (local: `~/Desktop/personal-projects/marketplace`) — "Sean's personal Claude Code plugins for SaaS engineering and automations."
2. **seanningtatum-plugins** — repo `github.com/SeanningTatum/claude-plugins` (local: `~/Desktop/personal-projects/claude-plugins`)

Manifests: `.claude-plugin/marketplace.json` in each repo + per-plugin `plugins/<name>/.claude-plugin/plugin.json`.

**Totals:** 2 marketplaces, 5 plugins, 57 items (32 skills incl. 2 templates, 16 commands, 7 agents, 1 rule, 1 hook). cf-saas-stack also bundles 3 MCP server configs (tavily, playwright, posthog).

## Items

| Plugin | Item | Type | Description |
|---|---|---|---|
| engineering-toolkit | client-review | skill | Turn any HTML doc into an offline commentable artifact for client review; read comments back as markdown |
| engineering-toolkit | create-pr-with-review | skill | Open a PR pre-reviewed by Greptile CLI; Playwright browser proof + P1/P2/P3 auto-fix ruleset |
| engineering-toolkit | new-app | skill | Scaffold a new app from the cf-saas-starter-react-router template |
| engineering-toolkit | pr-format | skill | Format PR descriptions: WHY/WHAT/HOW/SOLUTION/VERIFICATION/CAVEATS/NEXT STEPS |
| engineering-toolkit | release | skill | Squash-merge, pick next semver tag, publish GitHub release with marketing-grade notes |
| engineering-toolkit | resolve-comments | skill | Auto-resolve GitHub PR review comments by P1/P2/P3 severity; re-trigger Greptile re-review |
| cf-saas-stack | 20 skills | skills | Stack conventions: Better Auth, CF Workflows, D1/Drizzle schema, Resend emails, env vars, error classes, PostHog flags, i18n, ShadCN modals, models, Playwright E2E, repository pattern, routes, Stripe, structured output, test creds, testing workflow (auth, cloudflare-workflows, context-clients, context-docs, database, docs, emails, environment-variables, errors, feature-flags, i18n, modals, models, playwright-tests, repository-pattern, routes, stripe, structured-output, test-credentials, testing-workflow) |
| cf-saas-stack | 11 commands | commands | architecture-tracker, create-feature-flag, db-migration, docs-structure, dry-audit, implement-feature, organization-best-practices, posthog-setup, pr-checker, setup-widget, sync-changes |
| cf-saas-stack | 5 agents | agents | architecture-tracker, context-keeper, data-analytics, logger, tester |
| dev-workflows | 4 skills | skills | frontend-task, prompts, pull-request, tailwind |
| dev-workflows | 5 commands | commands | create-pull-request, frontend-design, plan-with-subagents, principal-review, ux-product-thinking |
| dev-workflows | 2 agents | agents | figma-design-validator, figma-to-tailwind-converter |
| project-management | changelog | rule + hook | Changelog enforcement — PreToolUse hook on `git commit` runs pre-commit-changelog.sh |
| automation-toolkit | example-skill | skill (template) | Starter template placeholder — exclude from public display |
| engineering-toolkit | example-skill | skill (template) | Starter template placeholder — exclude from public display |

## Category suggestion for /marketplace sidebar

- Engineering (engineering-toolkit skills)
- Stack Conventions (cf-saas-stack skills)
- Commands (all commands)
- Agents (all agents)
- Workflow (dev-workflows, project-management)
