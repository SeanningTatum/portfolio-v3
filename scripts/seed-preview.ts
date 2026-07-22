#!/usr/bin/env bun
// Deterministic fixture seed for local D1 + per-PR preview databases.
//
// Usage:
//   bun scripts/seed-preview.ts              # local D1 (wrangler d1 execute DATABASE --local)
//   bun scripts/seed-preview.ts --preview     # preview-env D1 (--env preview --remote)
//   bun scripts/seed-preview.ts --remote --force-production
//                                             # top-level prod D1 (refuses without the flag)
//
// Seeds three Better Auth email/password fixtures (admin / user / banned),
// all sharing password `Password123!`. Fixture rows use fixed `seed-*` ids
// and `INSERT OR IGNORE`, so this is safe to rerun on every `bun run dev`
// invocation and on every PR synchronize in CI — it never overwrites rows a
// human or test has since modified.
//
// See `.brain/rules/repository.md` ("Seed data") for the rule that every
// feature adding a table or user-visible data must extend these fixtures in
// the same diff.
import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { hashPassword } from "better-auth/crypto";

interface Fixture {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  emailVerified: boolean;
  banned: boolean;
  banReason?: string;
}

const PASSWORD = "Password123!";

const FIXTURES: Fixture[] = [
  {
    id: "seed-admin",
    name: "Admin Preview",
    email: "admin@preview.local",
    role: "admin",
    emailVerified: true,
    banned: false,
  },
  {
    id: "seed-user",
    name: "User Preview",
    email: "user@preview.local",
    role: "user",
    emailVerified: true,
    banned: false,
  },
  {
    id: "seed-banned",
    name: "Banned Preview",
    email: "banned@preview.local",
    role: "user",
    emailVerified: true,
    banned: true,
    banReason: "Seeded fixture for ban UI testing",
  },
];

interface ProjectFixture {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  year: number;
  stack: string[];
  role: string;
  thumbnailUrl?: string;
  featured: boolean;
  sortOrder: number;
  // Case-study fields (feat-009) — left undefined for projects without a
  // detail page written yet.
  client?: string;
  heroImageUrl?: string;
  why?: string;
  how?: string;
  solution?: string;
  statsJson?: { label: string; value: string }[];
}

const PROJECT_FIXTURES: ProjectFixture[] = [
  {
    id: "seed-project-portfolio-v3",
    slug: "portfolio-v3",
    title: "portfolio-v3",
    summary: "This site — a Cloudflare-native portfolio with a real backend.",
    category: "saas",
    year: 2026,
    stack: ["react-router", "cloudflare-workers", "effect-ts", "d1", "trpc"],
    role: "Solo builder",
    featured: true,
    sortOrder: 0,
    client: "Personal",
    why:
      "Most portfolios are static marketing pages. I wanted mine to double " +
      "as a demonstration of the exact stack I ship for clients — real " +
      "auth, a real database, real tests — not a Notion export.",
    how:
      "Built on the Cloudflare SaaS stack: Workers + React Router v7 + tRPC " +
      "+ D1/Drizzle + Better Auth + Effect TS. Every repository is an " +
      "Effect.Service with typed tagged errors; every route runs through " +
      "runProcedure so failures translate into typed tRPC codes instead of " +
      "leaking stack traces.",
    solution:
      "A harness-driven codebase where the brain (.brain/) is as load-bearing " +
      "as the code — recipes, rules, and per-feature docs keep an AI " +
      "collaborator (or a future me) from re-deriving conventions from " +
      "scratch every session.",
    statsJson: [
      { label: "Unit tests", value: "234+" },
      { label: "Cold start", value: "<50ms" },
    ],
  },
  {
    id: "seed-project-cf-saas-starter",
    slug: "cf-saas-starter",
    title: "CF SaaS Starter",
    summary: "Opinionated template for shipping SaaS on Cloudflare Workers.",
    category: "tooling",
    year: 2025,
    stack: ["react-router", "cloudflare-workers", "effect-ts", "better-auth"],
    role: "Author & maintainer",
    featured: false,
    sortOrder: 1,
    client: "Open source",
    why:
      "Every new Cloudflare side project meant re-wiring D1, auth, and " +
      "tRPC from zero. Wanted a template that encoded the decisions once.",
    how:
      "Extracted the auth + repository + error-handling patterns from " +
      "client work into a reusable `bun create` template with Better Auth, " +
      "Drizzle/D1, and an Effect TS service layer pre-wired.",
    solution:
      "A starter that gets a new Cloudflare SaaS from `git clone` to a " +
      "working signup flow in under ten minutes.",
    statsJson: [{ label: "GitHub stars", value: "120+" }],
  },
  {
    id: "seed-project-day-trader",
    slug: "day-trader",
    title: "Day Trader",
    summary: "Paper-trading simulator with live market data and a leaderboard.",
    category: "experiment",
    year: 2025,
    stack: ["next.js", "postgres", "websockets"],
    role: "Full-stack engineer",
    featured: false,
    sortOrder: 2,
  },
  {
    id: "seed-project-home-karaoke",
    slug: "home-karaoke",
    title: "Home Karaoke",
    summary: "Self-hosted karaoke queue app for house parties — phone as remote.",
    category: "tooling",
    year: 2024,
    stack: ["react", "node", "sqlite"],
    role: "Solo builder",
    featured: false,
    sortOrder: 3,
  },
];

interface SkillFixture {
  id: string;
  slug: string;
  name: string;
  description: string;
  type: "skill" | "command" | "agent" | "rule" | "hook";
  category: string;
  plugin: string;
  marketplaceRepo: string;
  repoUrl: string;
  isNew: boolean;
  sortOrder: number;
}

// Seed source: `.brain/features/skills-marketplace/skills-inventory.md`.
// 55 public items (57 total minus the 2 `example-skill` templates) across
// two marketplaces — `sean-skills` (github.com/SeanningTatum/marketplace)
// and `seanningtatum-plugins` (github.com/SeanningTatum/claude-plugins).
// sortOrder blocks: engineering (0-5) -> stack-conventions (6-25) ->
// workflow (26-31) -> commands (32-47) -> agents (48-54), alphabetical
// within each block. `isNew` = the 5 most recently added items (by git log
// in the local repos), all engineering-toolkit skills.
const MARKETPLACE_REPO_URL =
  "https://github.com/SeanningTatum/marketplace/tree/main/plugins";
const CLAUDE_PLUGINS_REPO_URL =
  "https://github.com/SeanningTatum/claude-plugins/tree/main/plugins";

const SKILL_FIXTURES: SkillFixture[] = [
  // --- engineering (engineering-toolkit skills) ---
  {
    id: "seed-skill-client-review",
    slug: "client-review",
    name: "Client Review",
    description:
      "Turn any HTML doc into an offline commentable artifact for client review; read comments as markdown.",
    type: "skill",
    category: "engineering",
    plugin: "engineering-toolkit",
    marketplaceRepo: "sean-skills",
    repoUrl: `${MARKETPLACE_REPO_URL}/engineering-toolkit`,
    isNew: true,
    sortOrder: 0,
  },
  {
    id: "seed-skill-create-pr-with-review",
    slug: "create-pr-with-review",
    name: "Create PR With Review",
    description:
      "Open a PR pre-reviewed by Greptile CLI, backed by Playwright browser proof and P1/P2/P3 auto-fixes.",
    type: "skill",
    category: "engineering",
    plugin: "engineering-toolkit",
    marketplaceRepo: "sean-skills",
    repoUrl: `${MARKETPLACE_REPO_URL}/engineering-toolkit`,
    isNew: true,
    sortOrder: 1,
  },
  {
    id: "seed-skill-new-app",
    slug: "new-app",
    name: "New App",
    description:
      "Scaffold a new app from the cf-saas-starter-react-router GitHub template and run the setup wizard.",
    type: "skill",
    category: "engineering",
    plugin: "engineering-toolkit",
    marketplaceRepo: "sean-skills",
    repoUrl: `${MARKETPLACE_REPO_URL}/engineering-toolkit`,
    isNew: true,
    sortOrder: 2,
  },
  {
    id: "seed-skill-pr-format",
    slug: "pr-format",
    name: "PR Format",
    description:
      "Format PR descriptions into WHY/WHAT/HOW/SOLUTION/VERIFICATION/CAVEATS/NEXT STEPS sections.",
    type: "skill",
    category: "engineering",
    plugin: "engineering-toolkit",
    marketplaceRepo: "sean-skills",
    repoUrl: `${MARKETPLACE_REPO_URL}/engineering-toolkit`,
    isNew: false,
    sortOrder: 3,
  },
  {
    id: "seed-skill-release",
    slug: "release",
    name: "Release",
    description:
      "Squash-merge, pick the next semver tag, and publish a GitHub release with polished notes.",
    type: "skill",
    category: "engineering",
    plugin: "engineering-toolkit",
    marketplaceRepo: "sean-skills",
    repoUrl: `${MARKETPLACE_REPO_URL}/engineering-toolkit`,
    isNew: true,
    sortOrder: 4,
  },
  {
    id: "seed-skill-resolve-comments",
    slug: "resolve-comments",
    name: "Resolve Comments",
    description:
      "Auto-resolve GitHub PR review comments by P1/P2/P3 severity and re-trigger Greptile re-review.",
    type: "skill",
    category: "engineering",
    plugin: "engineering-toolkit",
    marketplaceRepo: "sean-skills",
    repoUrl: `${MARKETPLACE_REPO_URL}/engineering-toolkit`,
    isNew: true,
    sortOrder: 5,
  },

  // --- stack-conventions (cf-saas-stack skills) ---
  {
    id: "seed-skill-auth",
    slug: "auth",
    name: "Auth",
    description:
      "Better Auth authentication patterns and conventions for Cloudflare Workers projects.",
    type: "skill",
    category: "stack-conventions",
    plugin: "cf-saas-stack",
    marketplaceRepo: "seanningtatum-plugins",
    repoUrl: `${CLAUDE_PLUGINS_REPO_URL}/cf-saas-stack`,
    isNew: false,
    sortOrder: 6,
  },
  {
    id: "seed-skill-cloudflare-workflows",
    slug: "cloudflare-workflows",
    name: "Cloudflare Workflows",
    description:
      "Cloudflare Workflows patterns for background tasks and async processing.",
    type: "skill",
    category: "stack-conventions",
    plugin: "cf-saas-stack",
    marketplaceRepo: "seanningtatum-plugins",
    repoUrl: `${CLAUDE_PLUGINS_REPO_URL}/cf-saas-stack`,
    isNew: false,
    sortOrder: 7,
  },
  {
    id: "seed-skill-context-clients",
    slug: "context-clients",
    name: "Context Clients",
    description:
      "Context-based client pattern for passing external service clients through request context.",
    type: "skill",
    category: "stack-conventions",
    plugin: "cf-saas-stack",
    marketplaceRepo: "seanningtatum-plugins",
    repoUrl: `${CLAUDE_PLUGINS_REPO_URL}/cf-saas-stack`,
    isNew: false,
    sortOrder: 8,
  },
  {
    id: "seed-skill-context-docs",
    slug: "context-docs",
    name: "Context Docs",
    description:
      "Documentation hierarchy and maintenance rules for context docs and architecture files.",
    type: "skill",
    category: "stack-conventions",
    plugin: "cf-saas-stack",
    marketplaceRepo: "seanningtatum-plugins",
    repoUrl: `${CLAUDE_PLUGINS_REPO_URL}/cf-saas-stack`,
    isNew: false,
    sortOrder: 9,
  },
  {
    id: "seed-skill-database",
    slug: "database",
    name: "Database",
    description: "Drizzle ORM database schema patterns and conventions for SQLite/D1.",
    type: "skill",
    category: "stack-conventions",
    plugin: "cf-saas-stack",
    marketplaceRepo: "seanningtatum-plugins",
    repoUrl: `${CLAUDE_PLUGINS_REPO_URL}/cf-saas-stack`,
    isNew: false,
    sortOrder: 10,
  },
  {
    id: "seed-skill-docs",
    slug: "docs",
    name: "Docs",
    description:
      "Documentation guidelines for creating and maintaining a docs folder structure.",
    type: "skill",
    category: "stack-conventions",
    plugin: "cf-saas-stack",
    marketplaceRepo: "seanningtatum-plugins",
    repoUrl: `${CLAUDE_PLUGINS_REPO_URL}/cf-saas-stack`,
    isNew: false,
    sortOrder: 11,
  },
  {
    id: "seed-skill-emails",
    slug: "emails",
    name: "Emails",
    description:
      "Email template patterns using Resend with type-safe generator functions.",
    type: "skill",
    category: "stack-conventions",
    plugin: "cf-saas-stack",
    marketplaceRepo: "seanningtatum-plugins",
    repoUrl: `${CLAUDE_PLUGINS_REPO_URL}/cf-saas-stack`,
    isNew: false,
    sortOrder: 12,
  },
  {
    id: "seed-skill-environment-variables",
    slug: "environment-variables",
    name: "Environment Variables",
    description:
      "Environment variable access patterns for Cloudflare Workers — never use process.env.",
    type: "skill",
    category: "stack-conventions",
    plugin: "cf-saas-stack",
    marketplaceRepo: "seanningtatum-plugins",
    repoUrl: `${CLAUDE_PLUGINS_REPO_URL}/cf-saas-stack`,
    isNew: false,
    sortOrder: 13,
  },
  {
    id: "seed-skill-errors",
    slug: "errors",
    name: "Errors",
    description:
      "Custom error class patterns for consistent error handling across repositories.",
    type: "skill",
    category: "stack-conventions",
    plugin: "cf-saas-stack",
    marketplaceRepo: "seanningtatum-plugins",
    repoUrl: `${CLAUDE_PLUGINS_REPO_URL}/cf-saas-stack`,
    isNew: false,
    sortOrder: 14,
  },
  {
    id: "seed-skill-feature-flags",
    slug: "feature-flags",
    name: "Feature Flags",
    description: "PostHog feature flag evaluation patterns with server-side loading.",
    type: "skill",
    category: "stack-conventions",
    plugin: "cf-saas-stack",
    marketplaceRepo: "seanningtatum-plugins",
    repoUrl: `${CLAUDE_PLUGINS_REPO_URL}/cf-saas-stack`,
    isNew: false,
    sortOrder: 15,
  },
  {
    id: "seed-skill-i18n",
    slug: "i18n",
    name: "i18n",
    description: "Internationalization patterns using remix-i18next and react-i18next.",
    type: "skill",
    category: "stack-conventions",
    plugin: "cf-saas-stack",
    marketplaceRepo: "seanningtatum-plugins",
    repoUrl: `${CLAUDE_PLUGINS_REPO_URL}/cf-saas-stack`,
    isNew: false,
    sortOrder: 16,
  },
  {
    id: "seed-skill-modals",
    slug: "modals",
    name: "Modals",
    description: "Modal component patterns using ShadCN Dialog with tRPC mutations.",
    type: "skill",
    category: "stack-conventions",
    plugin: "cf-saas-stack",
    marketplaceRepo: "seanningtatum-plugins",
    repoUrl: `${CLAUDE_PLUGINS_REPO_URL}/cf-saas-stack`,
    isNew: false,
    sortOrder: 17,
  },
  {
    id: "seed-skill-models",
    slug: "models",
    name: "Models",
    description: "Zod schema patterns for data models and runtime validation.",
    type: "skill",
    category: "stack-conventions",
    plugin: "cf-saas-stack",
    marketplaceRepo: "seanningtatum-plugins",
    repoUrl: `${CLAUDE_PLUGINS_REPO_URL}/cf-saas-stack`,
    isNew: false,
    sortOrder: 18,
  },
  {
    id: "seed-skill-playwright-tests",
    slug: "playwright-tests",
    name: "Playwright Tests",
    description:
      "Playwright E2E testing rules including self-contained tests and element selection.",
    type: "skill",
    category: "stack-conventions",
    plugin: "cf-saas-stack",
    marketplaceRepo: "seanningtatum-plugins",
    repoUrl: `${CLAUDE_PLUGINS_REPO_URL}/cf-saas-stack`,
    isNew: false,
    sortOrder: 19,
  },
  {
    id: "seed-skill-repository-pattern",
    slug: "repository-pattern",
    name: "Repository Pattern",
    description: "Repository pattern for data access with layered architecture.",
    type: "skill",
    category: "stack-conventions",
    plugin: "cf-saas-stack",
    marketplaceRepo: "seanningtatum-plugins",
    repoUrl: `${CLAUDE_PLUGINS_REPO_URL}/cf-saas-stack`,
    isNew: false,
    sortOrder: 20,
  },
  {
    id: "seed-skill-routes",
    slug: "routes",
    name: "Routes",
    description: "React Router route layout patterns with server-side loaders.",
    type: "skill",
    category: "stack-conventions",
    plugin: "cf-saas-stack",
    marketplaceRepo: "seanningtatum-plugins",
    repoUrl: `${CLAUDE_PLUGINS_REPO_URL}/cf-saas-stack`,
    isNew: false,
    sortOrder: 21,
  },
  {
    id: "seed-skill-stripe",
    slug: "stripe",
    name: "Stripe",
    description:
      "Stripe integration guidelines for payment processing via context-based client.",
    type: "skill",
    category: "stack-conventions",
    plugin: "cf-saas-stack",
    marketplaceRepo: "seanningtatum-plugins",
    repoUrl: `${CLAUDE_PLUGINS_REPO_URL}/cf-saas-stack`,
    isNew: false,
    sortOrder: 22,
  },
  {
    id: "seed-skill-structured-output",
    slug: "structured-output",
    name: "Structured Output",
    description: "Structured JSON output patterns for Gemini and Claude AI APIs.",
    type: "skill",
    category: "stack-conventions",
    plugin: "cf-saas-stack",
    marketplaceRepo: "seanningtatum-plugins",
    repoUrl: `${CLAUDE_PLUGINS_REPO_URL}/cf-saas-stack`,
    isNew: false,
    sortOrder: 23,
  },
  {
    id: "seed-skill-test-credentials",
    slug: "test-credentials",
    name: "Test Credentials",
    description: "Test credentials and setup instructions for local browser testing.",
    type: "skill",
    category: "stack-conventions",
    plugin: "cf-saas-stack",
    marketplaceRepo: "seanningtatum-plugins",
    repoUrl: `${CLAUDE_PLUGINS_REPO_URL}/cf-saas-stack`,
    isNew: false,
    sortOrder: 24,
  },
  {
    id: "seed-skill-testing-workflow",
    slug: "testing-workflow",
    name: "Testing Workflow",
    description:
      "Testing workflow for generating testing plans, verification, and E2E tests.",
    type: "skill",
    category: "stack-conventions",
    plugin: "cf-saas-stack",
    marketplaceRepo: "seanningtatum-plugins",
    repoUrl: `${CLAUDE_PLUGINS_REPO_URL}/cf-saas-stack`,
    isNew: false,
    sortOrder: 25,
  },

  // --- workflow (dev-workflows skills + project-management rule/hook) ---
  {
    id: "seed-skill-changelog",
    slug: "changelog",
    name: "Changelog",
    description: "Enforce Keep a Changelog format updates before every git commit.",
    type: "rule",
    category: "workflow",
    plugin: "project-management",
    marketplaceRepo: "seanningtatum-plugins",
    repoUrl: `${CLAUDE_PLUGINS_REPO_URL}/project-management`,
    isNew: false,
    sortOrder: 26,
  },
  {
    id: "seed-skill-changelog-hook",
    slug: "changelog-hook",
    name: "Changelog Hook",
    description: "PreToolUse hook that blocks git commit until CHANGELOG.md is updated.",
    type: "hook",
    category: "workflow",
    plugin: "project-management",
    marketplaceRepo: "seanningtatum-plugins",
    repoUrl: `${CLAUDE_PLUGINS_REPO_URL}/project-management`,
    isNew: false,
    sortOrder: 27,
  },
  {
    id: "seed-skill-frontend-task",
    slug: "frontend-task",
    name: "Frontend Task",
    description:
      "Frontend task guidelines for component creation, forms, cache management, i18n, and Playwright tests.",
    type: "skill",
    category: "workflow",
    plugin: "dev-workflows",
    marketplaceRepo: "seanningtatum-plugins",
    repoUrl: `${CLAUDE_PLUGINS_REPO_URL}/dev-workflows`,
    isNew: false,
    sortOrder: 28,
  },
  {
    id: "seed-skill-prompts",
    slug: "prompts",
    name: "Prompts",
    description:
      "AI prompt organization patterns with structured output and constant exports.",
    type: "skill",
    category: "workflow",
    plugin: "dev-workflows",
    marketplaceRepo: "seanningtatum-plugins",
    repoUrl: `${CLAUDE_PLUGINS_REPO_URL}/dev-workflows`,
    isNew: false,
    sortOrder: 29,
  },
  {
    id: "seed-skill-pull-request",
    slug: "pull-request",
    name: "Pull Request",
    description: "Pull request description guidelines and template structure.",
    type: "skill",
    category: "workflow",
    plugin: "dev-workflows",
    marketplaceRepo: "seanningtatum-plugins",
    repoUrl: `${CLAUDE_PLUGINS_REPO_URL}/dev-workflows`,
    isNew: false,
    sortOrder: 30,
  },
  {
    id: "seed-skill-tailwind",
    slug: "tailwind",
    name: "Tailwind",
    description:
      "Tailwind CSS and color variable rules including the cn() utility and semantic CSS variables.",
    type: "skill",
    category: "workflow",
    plugin: "dev-workflows",
    marketplaceRepo: "seanningtatum-plugins",
    repoUrl: `${CLAUDE_PLUGINS_REPO_URL}/dev-workflows`,
    isNew: false,
    sortOrder: 31,
  },

  // --- commands (all plugins) ---
  {
    id: "seed-skill-cmd-architecture-tracker",
    slug: "architecture-tracker",
    name: "Architecture Tracker",
    description:
      "Maintain the living high-level architecture doc with route maps, feature flows, and a changelog.",
    type: "command",
    category: "commands",
    plugin: "cf-saas-stack",
    marketplaceRepo: "seanningtatum-plugins",
    repoUrl: `${CLAUDE_PLUGINS_REPO_URL}/cf-saas-stack`,
    isNew: false,
    sortOrder: 32,
  },
  {
    id: "seed-skill-cmd-create-feature-flag",
    slug: "create-feature-flag",
    name: "Create Feature Flag",
    description:
      "Create and manage PostHog feature flags with proper naming conventions and rollout patterns.",
    type: "command",
    category: "commands",
    plugin: "cf-saas-stack",
    marketplaceRepo: "seanningtatum-plugins",
    repoUrl: `${CLAUDE_PLUGINS_REPO_URL}/cf-saas-stack`,
    isNew: false,
    sortOrder: 33,
  },
  {
    id: "seed-skill-cmd-create-pull-request",
    slug: "create-pull-request",
    name: "Create Pull Request",
    description:
      "Create GitHub PRs with descriptions following the team's template structure.",
    type: "command",
    category: "commands",
    plugin: "dev-workflows",
    marketplaceRepo: "seanningtatum-plugins",
    repoUrl: `${CLAUDE_PLUGINS_REPO_URL}/dev-workflows`,
    isNew: false,
    sortOrder: 34,
  },
  {
    id: "seed-skill-cmd-db-migration",
    slug: "db-migration",
    name: "DB Migration",
    description:
      "Generate Drizzle ORM migrations for schema changes with proper naming conventions.",
    type: "command",
    category: "commands",
    plugin: "cf-saas-stack",
    marketplaceRepo: "seanningtatum-plugins",
    repoUrl: `${CLAUDE_PLUGINS_REPO_URL}/cf-saas-stack`,
    isNew: false,
    sortOrder: 35,
  },
  {
    id: "seed-skill-cmd-docs-structure",
    slug: "docs-structure",
    name: "Docs Structure",
    description:
      "Scaffold and maintain a structured docs/ directory with architecture context files and templates.",
    type: "command",
    category: "commands",
    plugin: "cf-saas-stack",
    marketplaceRepo: "seanningtatum-plugins",
    repoUrl: `${CLAUDE_PLUGINS_REPO_URL}/cf-saas-stack`,
    isNew: false,
    sortOrder: 36,
  },
  {
    id: "seed-skill-cmd-dry-audit",
    slug: "dry-audit",
    name: "DRY Audit",
    description: "Audit the codebase for DRY violations and enforce folder structure conventions.",
    type: "command",
    category: "commands",
    plugin: "cf-saas-stack",
    marketplaceRepo: "seanningtatum-plugins",
    repoUrl: `${CLAUDE_PLUGINS_REPO_URL}/cf-saas-stack`,
    isNew: false,
    sortOrder: 37,
  },
  {
    id: "seed-skill-cmd-frontend-design",
    slug: "frontend-design",
    name: "Frontend Design",
    description:
      "Create distinctive, production-grade frontend interfaces with bold aesthetics and high design quality.",
    type: "command",
    category: "commands",
    plugin: "dev-workflows",
    marketplaceRepo: "seanningtatum-plugins",
    repoUrl: `${CLAUDE_PLUGINS_REPO_URL}/dev-workflows`,
    isNew: false,
    sortOrder: 38,
  },
  {
    id: "seed-skill-cmd-implement-feature",
    slug: "implement-feature",
    name: "Implement Feature",
    description:
      "Execute feature implementations by delegating to specialized tasks based on requirements.",
    type: "command",
    category: "commands",
    plugin: "cf-saas-stack",
    marketplaceRepo: "seanningtatum-plugins",
    repoUrl: `${CLAUDE_PLUGINS_REPO_URL}/cf-saas-stack`,
    isNew: false,
    sortOrder: 39,
  },
  {
    id: "seed-skill-cmd-organization-best-practices",
    slug: "organization-best-practices",
    name: "Organization Best Practices",
    description:
      "Guidance for implementing multi-tenant organizations, teams, and RBAC using Better Auth.",
    type: "command",
    category: "commands",
    plugin: "cf-saas-stack",
    marketplaceRepo: "seanningtatum-plugins",
    repoUrl: `${CLAUDE_PLUGINS_REPO_URL}/cf-saas-stack`,
    isNew: false,
    sortOrder: 40,
  },
  {
    id: "seed-skill-cmd-plan-with-subagents",
    slug: "plan-with-subagents",
    name: "Plan With Subagents",
    description:
      "Create structured implementation plans with task assignments and PR validation steps.",
    type: "command",
    category: "commands",
    plugin: "dev-workflows",
    marketplaceRepo: "seanningtatum-plugins",
    repoUrl: `${CLAUDE_PLUGINS_REPO_URL}/dev-workflows`,
    isNew: false,
    sortOrder: 41,
  },
  {
    id: "seed-skill-cmd-posthog-setup",
    slug: "posthog-setup",
    name: "PostHog Setup",
    description:
      "Set up PostHog analytics and feature flags in Cloudflare Workers + React Router projects.",
    type: "command",
    category: "commands",
    plugin: "cf-saas-stack",
    marketplaceRepo: "seanningtatum-plugins",
    repoUrl: `${CLAUDE_PLUGINS_REPO_URL}/cf-saas-stack`,
    isNew: false,
    sortOrder: 42,
  },
  {
    id: "seed-skill-cmd-pr-checker",
    slug: "pr-checker",
    name: "PR Checker",
    description: "Validate that changes follow project standards before creating a pull request.",
    type: "command",
    category: "commands",
    plugin: "cf-saas-stack",
    marketplaceRepo: "seanningtatum-plugins",
    repoUrl: `${CLAUDE_PLUGINS_REPO_URL}/cf-saas-stack`,
    isNew: false,
    sortOrder: 43,
  },
  {
    id: "seed-skill-cmd-principal-review",
    slug: "principal-review",
    name: "Principal Review",
    description:
      "Senior/principal engineer review verifying implementation matches plan and best practices.",
    type: "command",
    category: "commands",
    plugin: "dev-workflows",
    marketplaceRepo: "seanningtatum-plugins",
    repoUrl: `${CLAUDE_PLUGINS_REPO_URL}/dev-workflows`,
    isNew: false,
    sortOrder: 44,
  },
  {
    id: "seed-skill-cmd-setup-widget",
    slug: "setup-widget",
    name: "Setup Widget",
    description:
      "Set up an embeddable widget system (like Intercom) addable to any site via a script tag.",
    type: "command",
    category: "commands",
    plugin: "cf-saas-stack",
    marketplaceRepo: "seanningtatum-plugins",
    repoUrl: `${CLAUDE_PLUGINS_REPO_URL}/cf-saas-stack`,
    isNew: false,
    sortOrder: 45,
  },
  {
    id: "seed-skill-cmd-sync-changes",
    slug: "sync-changes",
    name: "Sync Changes",
    description:
      "Orchestrate documentation, analytics, and test sync with the latest codebase changes.",
    type: "command",
    category: "commands",
    plugin: "cf-saas-stack",
    marketplaceRepo: "seanningtatum-plugins",
    repoUrl: `${CLAUDE_PLUGINS_REPO_URL}/cf-saas-stack`,
    isNew: false,
    sortOrder: 46,
  },
  {
    id: "seed-skill-cmd-ux-product-thinking",
    slug: "ux-product-thinking",
    name: "UX Product Thinking",
    description:
      "Structured UX/UI design approach aligning interface decisions with product goals and research.",
    type: "command",
    category: "commands",
    plugin: "dev-workflows",
    marketplaceRepo: "seanningtatum-plugins",
    repoUrl: `${CLAUDE_PLUGINS_REPO_URL}/dev-workflows`,
    isNew: false,
    sortOrder: 47,
  },

  // --- agents (all plugins) ---
  {
    id: "seed-skill-agent-architecture-tracker",
    slug: "architecture-tracker-agent",
    name: "Architecture Tracker",
    description:
      "Maintain high-level architecture documentation with visual diagrams and feature flows.",
    type: "agent",
    category: "agents",
    plugin: "cf-saas-stack",
    marketplaceRepo: "seanningtatum-plugins",
    repoUrl: `${CLAUDE_PLUGINS_REPO_URL}/cf-saas-stack`,
    isNew: false,
    sortOrder: 48,
  },
  {
    id: "seed-skill-agent-context-keeper",
    slug: "context-keeper",
    name: "Context Keeper",
    description:
      "Documentation specialist that keeps project context docs in sync after feature work.",
    type: "agent",
    category: "agents",
    plugin: "cf-saas-stack",
    marketplaceRepo: "seanningtatum-plugins",
    repoUrl: `${CLAUDE_PLUGINS_REPO_URL}/cf-saas-stack`,
    isNew: false,
    sortOrder: 49,
  },
  {
    id: "seed-skill-agent-data-analytics",
    slug: "data-analytics",
    name: "Data Analytics",
    description:
      "Design growth dashboards and KPI charts whenever a new schema or feature ships.",
    type: "agent",
    category: "agents",
    plugin: "cf-saas-stack",
    marketplaceRepo: "seanningtatum-plugins",
    repoUrl: `${CLAUDE_PLUGINS_REPO_URL}/cf-saas-stack`,
    isNew: false,
    sortOrder: 50,
  },
  {
    id: "seed-skill-agent-figma-design-validator",
    slug: "figma-design-validator",
    name: "Figma Design Validator",
    description:
      "Validate implemented UI against Figma designs for visual accuracy and compliance.",
    type: "agent",
    category: "agents",
    plugin: "dev-workflows",
    marketplaceRepo: "seanningtatum-plugins",
    repoUrl: `${CLAUDE_PLUGINS_REPO_URL}/dev-workflows`,
    isNew: false,
    sortOrder: 51,
  },
  {
    id: "seed-skill-agent-figma-to-tailwind-converter",
    slug: "figma-to-tailwind-converter",
    name: "Figma to Tailwind Converter",
    description:
      "Convert Figma code output's hardcoded colors to the project's CSS variable system.",
    type: "agent",
    category: "agents",
    plugin: "dev-workflows",
    marketplaceRepo: "seanningtatum-plugins",
    repoUrl: `${CLAUDE_PLUGINS_REPO_URL}/dev-workflows`,
    isNew: false,
    sortOrder: 52,
  },
  {
    id: "seed-skill-agent-logger",
    slug: "logger",
    name: "Logger",
    description:
      "Add structured, traceable debug logs throughout the codebase instead of AI comments.",
    type: "agent",
    category: "agents",
    plugin: "cf-saas-stack",
    marketplaceRepo: "seanningtatum-plugins",
    repoUrl: `${CLAUDE_PLUGINS_REPO_URL}/cf-saas-stack`,
    isNew: false,
    sortOrder: 53,
  },
  {
    id: "seed-skill-agent-tester",
    slug: "tester",
    name: "Tester",
    description:
      "Verify implementations end-to-end: testing plans, e2e tests, and results documentation.",
    type: "agent",
    category: "agents",
    plugin: "cf-saas-stack",
    marketplaceRepo: "seanningtatum-plugins",
    repoUrl: `${CLAUDE_PLUGINS_REPO_URL}/cf-saas-stack`,
    isNew: false,
    sortOrder: 54,
  },
];

function fail(message: string): never {
  console.error(`\x1b[31m✗ ${message}\x1b[0m`);
  process.exit(1);
}

function sqlString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

interface Target {
  /** Extra flags appended to `wrangler d1 execute DATABASE <flags> --file <tmp>`. */
  flags: string[];
  label: string;
}

function parseArgs(argv: string[]): Target {
  const hasPreview = argv.includes("--preview");
  const hasRemote = argv.includes("--remote");
  const hasForceProduction = argv.includes("--force-production");

  if (hasPreview && hasRemote) {
    fail("Pass either --preview or --remote, not both.");
  }

  if (hasRemote) {
    if (!hasForceProduction) {
      fail(
        [
          "Refusing to seed the top-level (production) D1 database.",
          "",
          "Seeding synthetic admin/user/banned fixtures into production is a",
          "footgun — it creates real, discoverable accounts (known password",
          `${PASSWORD}) with an admin role.`,
          "",
          "If you genuinely need to seed production (e.g. bootstrapping a",
          "fresh prod DB, emergency demo data), re-run with:",
          "",
          "  bun scripts/seed-preview.ts --remote --force-production",
        ].join("\n"),
      );
    }
    return { flags: ["--remote"], label: "production (--remote, forced)" };
  }

  if (hasPreview) {
    return { flags: ["--env", "preview", "--remote"], label: "preview" };
  }

  return { flags: ["--local"], label: "local" };
}

async function buildSql(): Promise<string> {
  const lines: string[] = [];
  const now = Date.now();

  for (const fixture of FIXTURES) {
    const passwordHash = await hashPassword(PASSWORD);

    lines.push(
      `INSERT OR IGNORE INTO user (id, name, email, email_verified, role, banned, ban_reason) VALUES (` +
        [
          sqlString(fixture.id),
          sqlString(fixture.name),
          sqlString(fixture.email),
          fixture.emailVerified ? 1 : 0,
          sqlString(fixture.role),
          fixture.banned ? 1 : 0,
          fixture.banReason ? sqlString(fixture.banReason) : "NULL",
        ].join(", ") +
        `);`,
    );

    lines.push(
      `INSERT OR IGNORE INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at) VALUES (` +
        [
          sqlString(`${fixture.id}-account`),
          sqlString(fixture.id),
          sqlString("credential"),
          sqlString(fixture.id),
          sqlString(passwordHash),
          now,
          now,
        ].join(", ") +
        `);`,
    );
  }

  for (const p of PROJECT_FIXTURES) {
    lines.push(
      `INSERT OR IGNORE INTO project (` +
        "id, slug, title, summary, category, year, stack, role, thumbnail_url, " +
        "featured, sort_order, client, hero_image_url, why, how, solution, stats_json" +
        `) VALUES (` +
        [
          sqlString(p.id),
          sqlString(p.slug),
          sqlString(p.title),
          sqlString(p.summary),
          sqlString(p.category),
          p.year,
          sqlString(JSON.stringify(p.stack)),
          sqlString(p.role),
          p.thumbnailUrl ? sqlString(p.thumbnailUrl) : "NULL",
          p.featured ? 1 : 0,
          p.sortOrder,
          p.client ? sqlString(p.client) : "NULL",
          p.heroImageUrl ? sqlString(p.heroImageUrl) : "NULL",
          p.why ? sqlString(p.why) : "NULL",
          p.how ? sqlString(p.how) : "NULL",
          p.solution ? sqlString(p.solution) : "NULL",
          p.statsJson ? sqlString(JSON.stringify(p.statsJson)) : "NULL",
        ].join(", ") +
        `);`,
    );
  }

  for (const s of SKILL_FIXTURES) {
    lines.push(
      `INSERT OR IGNORE INTO skill (` +
        "id, slug, name, description, type, category, plugin, marketplace_repo, " +
        "repo_url, is_new, sort_order" +
        `) VALUES (` +
        [
          sqlString(s.id),
          sqlString(s.slug),
          sqlString(s.name),
          sqlString(s.description),
          sqlString(s.type),
          sqlString(s.category),
          sqlString(s.plugin),
          sqlString(s.marketplaceRepo),
          sqlString(s.repoUrl),
          s.isNew ? 1 : 0,
          s.sortOrder,
        ].join(", ") +
        `);`,
    );
  }

  return lines.join("\n") + "\n";
}

function printCredentialsTable(): void {
  console.log("\nSeeded credentials (password for all: " + PASSWORD + "):\n");
  const rows = FIXTURES.map((f) => ({
    email: f.email,
    role: f.role,
    note: f.banned ? "banned" : "",
  }));
  const emailWidth = Math.max(...rows.map((r) => r.email.length), "email".length);
  const roleWidth = Math.max(...rows.map((r) => r.role.length), "role".length);

  const header = `  ${"email".padEnd(emailWidth)}  ${"role".padEnd(roleWidth)}  note`;
  console.log(header);
  console.log(`  ${"-".repeat(emailWidth)}  ${"-".repeat(roleWidth)}  ----`);
  for (const row of rows) {
    console.log(`  ${row.email.padEnd(emailWidth)}  ${row.role.padEnd(roleWidth)}  ${row.note}`);
  }
  console.log("");
}

/**
 * Markdown summary of everything the seed creates — consumed by
 * .github/workflows/preview.yml to build the PR sticky comment, so the
 * comment always reflects the actual fixtures. Extend this alongside
 * FIXTURES (and any future seeded tables).
 */
function describeMarkdown(): string {
  const lines: string[] = [];
  lines.push("#### Seeded test accounts");
  lines.push("");
  lines.push(`Password for all accounts: \`${PASSWORD}\``);
  lines.push("");
  lines.push("| Email | Role | State |");
  lines.push("|-------|------|-------|");
  for (const f of FIXTURES) {
    const state = f.banned
      ? `banned (${f.banReason ?? "no reason"})`
      : f.emailVerified
        ? "active, email verified"
        : "active";
    lines.push(`| \`${f.email}\` | ${f.role} | ${state} |`);
  }
  lines.push("");
  lines.push(
    "Seeded data: the accounts above (Better Auth `user` + credential " +
      "`account` rows), plus " +
      `${PROJECT_FIXTURES.length} rows in the \`project\` table (portfolio ` +
      "showcase content — see below), plus " +
      `${SKILL_FIXTURES.length} rows in the \`skill\` table (Claude skills ` +
      "marketplace content). Fixtures are idempotent " +
      "(`INSERT OR IGNORE`, fixed `seed-*` ids), so data you create on the " +
      "preview survives new pushes to this PR.",
  );
  lines.push("");
  lines.push("#### Seeded projects");
  lines.push("");
  lines.push("| Slug | Category | Year | Featured |");
  lines.push("|------|----------|------|----------|");
  for (const p of PROJECT_FIXTURES) {
    lines.push(
      `| \`${p.slug}\` | ${p.category} | ${p.year} | ${p.featured ? "yes" : "no"} |`,
    );
  }
  lines.push("");
  lines.push("#### Seeded skills");
  lines.push("");
  lines.push(
    `${SKILL_FIXTURES.length} items across skill/command/agent/rule/hook types — ` +
      "see `.brain/features/skills-marketplace/skills-inventory.md` for the full breakdown.",
  );
  return lines.join("\n") + "\n";
}

async function main(): Promise<void> {
  if (process.argv.includes("--describe")) {
    process.stdout.write(describeMarkdown());
    return;
  }

  const target = parseArgs(process.argv.slice(2));
  const sql = await buildSql();

  const tmpFile = path.join(os.tmpdir(), `seed-preview-${Date.now()}.sql`);
  fs.writeFileSync(tmpFile, sql);

  let failure: string | undefined;
  try {
    console.log(`Seeding ${target.label} D1 (DATABASE binding)...`);
    const command = [
      "bunx",
      "wrangler",
      "d1",
      "execute",
      "DATABASE",
      ...target.flags,
      "--file",
      tmpFile,
    ].join(" ");

    execSync(command, { stdio: "inherit", env: process.env });

    console.log(
      `\x1b[32m✓ Seeded ${target.label} D1 with ${FIXTURES.length} fixture users + ` +
        `${PROJECT_FIXTURES.length} projects + ${SKILL_FIXTURES.length} skills\x1b[0m`,
    );
    printCredentialsTable();
  } catch (error: any) {
    failure = error?.message ?? String(error);
  } finally {
    fs.rmSync(tmpFile, { force: true });
  }

  if (failure) {
    fail(`Failed to seed D1: ${failure}`);
  }
}

if (import.meta.main) {
  main().catch((error) => {
    fail(`Unexpected error: ${error?.message ?? String(error)}`);
  });
}
