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

// NOTE: portfolio projects are no longer seeded into D1. Project content
// (feat-008/009) now lives in bundled markdown under `content/projects/*.md`,
// parsed at build time by `app/lib/content/projects.ts` — the `project` table
// was dropped. Nothing to seed here.

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
//
// PRUNED 2026-07-22 (user-directed): only `github.com/SeanningTatum/marketplace`
// (marketplace name "sean-skills") counts as a real, publicly-installable
// marketplace for now. That repo has exactly 2 plugins — engineering-toolkit
// (6 real skills below) and automation-toolkit (nothing but its
// `example-skill` template, so 0 real skills). The previously-seeded
// `seanningtatum-plugins` (github.com/SeanningTatum/claude-plugins) catalog
// and both `example-skill` template placeholders are excluded entirely — see
// `.brain/features/skills-marketplace/skills-inventory.md` for the full
// decision record.
const MARKETPLACE_SKILLS_URL =
  "https://github.com/SeanningTatum/marketplace/tree/main/plugins/engineering-toolkit/skills";

const SKILL_FIXTURES: SkillFixture[] = [
  // --- engineering (engineering-toolkit skills — the only real skills in
  // SeanningTatum/marketplace) ---
  {
    id: "seed-skill-client-review",
    slug: "client-review",
    name: "Client Review",
    description:
      "Turn any HTML doc into a self-contained, offline commentable artifact for a client to review, then read their comments back as markdown for agents.",
    type: "skill",
    category: "engineering",
    plugin: "engineering-toolkit",
    marketplaceRepo: "SeanningTatum/marketplace",
    repoUrl: `${MARKETPLACE_SKILLS_URL}/client-review`,
    isNew: true,
    sortOrder: 0,
  },
  {
    id: "seed-skill-create-pr-with-review",
    slug: "create-pr-with-review",
    name: "Create PR With Review",
    description:
      "Open a pull request that has already been through an AI review — runs the Greptile CLI, resolves findings by a P1/P2/P3 ruleset, then formats and creates the PR.",
    type: "skill",
    category: "engineering",
    plugin: "engineering-toolkit",
    marketplaceRepo: "SeanningTatum/marketplace",
    repoUrl: `${MARKETPLACE_SKILLS_URL}/create-pr-with-review`,
    isNew: true,
    sortOrder: 1,
  },
  {
    id: "seed-skill-new-app",
    slug: "new-app",
    name: "New App",
    description:
      "Scaffold a new application from the cf-saas-starter-react-router template — new GitHub repo, cloned locally, AGENTS.md seeded, then hand off to the setup wizard.",
    type: "skill",
    category: "engineering",
    plugin: "engineering-toolkit",
    marketplaceRepo: "SeanningTatum/marketplace",
    repoUrl: `${MARKETPLACE_SKILLS_URL}/new-app`,
    isNew: true,
    sortOrder: 2,
  },
  {
    id: "seed-skill-pr-format",
    slug: "pr-format",
    name: "PR Format",
    description:
      "Format PR descriptions for maximum readability using a fixed structure — WHY, WHAT, HOW, SOLUTION, VERIFICATION, CAVEATS, NEXT STEPS.",
    type: "skill",
    category: "engineering",
    plugin: "engineering-toolkit",
    marketplaceRepo: "SeanningTatum/marketplace",
    repoUrl: `${MARKETPLACE_SKILLS_URL}/pr-format`,
    isNew: false,
    sortOrder: 3,
  },
  {
    id: "seed-skill-release",
    slug: "release",
    name: "Release",
    description:
      "Ship a merged-ready PR as a versioned release: squash-merge, pick the next semver tag, and publish a GitHub release with marketing-grade notes.",
    type: "skill",
    category: "engineering",
    plugin: "engineering-toolkit",
    marketplaceRepo: "SeanningTatum/marketplace",
    repoUrl: `${MARKETPLACE_SKILLS_URL}/release`,
    isNew: true,
    sortOrder: 4,
  },
  {
    id: "seed-skill-resolve-comments",
    slug: "resolve-comments",
    name: "Resolve Comments",
    description:
      "Read a GitHub PR's review comments and resolve them automatically where safe, triaging each by a P1/P2/P3 severity ruleset; re-triggers Greptile re-review.",
    type: "skill",
    category: "engineering",
    plugin: "engineering-toolkit",
    marketplaceRepo: "SeanningTatum/marketplace",
    repoUrl: `${MARKETPLACE_SKILLS_URL}/resolve-comments`,
    isNew: true,
    sortOrder: 5,
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
      `${SKILL_FIXTURES.length} rows in the \`skill\` table (Claude skills ` +
      "marketplace content). Fixtures are idempotent " +
      "(`INSERT OR IGNORE`, fixed `seed-*` ids), so data you create on the " +
      "preview survives new pushes to this PR. (Portfolio project content " +
      "lives in bundled markdown under `content/projects/*.md`, not D1.)",
  );
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
        `${SKILL_FIXTURES.length} skills\x1b[0m`,
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
