# Progress — Rolling session log

> Single rolling log of "where am I right now". Append-only. Newest entry on top. **Per-task deep state lives in `<YYYY-MM-DD>-<task-slug>.md`** — this file is the index/state cursor.

## How to use

- **Start of session**: read the top entry to recover state.
- **During session**: append one bullet per meaningful checkpoint (decision, blocker, branch switch, test failure, scope change).
- **End of session**: add a `## Session end` block with: branch, last commit SHA, what's running/incomplete, what to do next.
- **Multi-day task**: link to the run note (`runs/<date>-<slug>.md`) for full detail. Keep entries here under ~5 lines each.

## Format per entry

```
## YYYY-MM-DD HH:MM (UTC) — <one-line summary>
- branch: <branch-name>
- in-progress feature: <feat-id> | none
- run note: <path or none>
- next: <one sentence>
```

---

## 2026-07-22 — projects→markdown refactor + marketplace prune SHIPPED
- branch: `main` (uncommitted batch continues — commits on user word)
- in-progress feature: none
- run notes: both 2026-07-22 run notes closed (projects-markdown-refactor, marketplace-prune-and-readme-prompt)
- shipped: (A) /projects + /projects/:slug now read bundled markdown (`content/projects/*.md`, Vite raw glob + pure frontmatter parser + Effect Schema, `ContentParseError`); D1 project layer deleted (drop migration 0003, repo, tRPC router, fixtures); (B) marketplace catalog 55→6 (only SeanningTatum/marketplace engineering-toolkit skills), local D1 re-seeded + verified; (C) README-gen prompt at `.brain/features/skills-marketplace/readme-generation-prompt.md`. Verify: typecheck, 373 tests, build, harness 11/11; all 4 pages screenshot-eyeballed on main thread
- outstanding: preview/remote D1 `skill` table still has old 55 rows (re-seed on next deploy); pre-existing 404-page nav center-jam cosmetic; commit batch on user word
- next: user copies README prompt into marketplace repo; commit

## 2026-07-22 — projects→markdown refactor + marketplace prune started (post-ship revisions)
- branch: `main` (uncommitted batch continues)
- in-progress feature: none (revisions to shipped feat-008/009/010 — statuses stay `shipped`, tracked via run notes)
- run notes: `.brain/runs/2026-07-22-projects-markdown-refactor.md` + `.brain/runs/2026-07-22-marketplace-prune-and-readme-prompt.md`
- scope: (A) /projects + /projects/:slug read bundled markdown (`content/projects/*.md`), D1 project layer deleted — opus agent; (B) marketplace catalog cut 55→6 (only SeanningTatum/marketplace repo skills) — sonnet agent; (C) README-gen prompt (WHAT/WHY/HOW + screenshots) for marketplace repo — sonnet agent
- next: agents land edits; main thread runs verify-done + eyeballs pixels

## 2026-07-22 — feat-011 console-v2 SHIPPED
- branch: `main` (uncommitted batch continues — commits on user word)
- in-progress feature: none (11/11 shipped)
- run note: `.brain/runs/2026-07-22-console-v2.md` (closed)
- shipped: sleek pass (front-lit chrome env, reflector floor + fog, hover-only lasers, motes, glass streak, richer script + late-night) + CRT OS (BIOS boot, interactive terminal w/ sudo-hire-sean, matrix/pong/starfield cycle, DVD saver, LED power ritual, clack/zap SFX, devtools hire() egg). 365 tests, e2e, build green; 17-screenshot browser walk PASS
- next: user real-GPU + audio spot check; commit batch on user word

## 2026-07-22 — feat-011 console-v2 started
- branch: `main` (uncommitted batch continues)
- in-progress feature: feat-011
- run note: `.brain/runs/2026-07-22-console-v2.md`
- scope: home console sleek pass (chrome env, hover lasers, reflective floor, motes, glass streak, richer script) + fun layer (power-on, screen modes, mini terminal, screensaver, LED off, late-night, sound, console art). NO konami (user-excluded).
- next: rework Lightformer env in hero-scene.client.tsx so chrome reads as chrome

## 2026-07-22 — feat-010 skills-marketplace SHIPPED
- branch: `main` (committing batch next — user-directed)
- in-progress feature: none (all 10 features shipped)
- run note: `.brain/runs/2026-07-22-skills-marketplace.md` (closed)
- shipped: /marketplace UI + skill data layer; enforcer minors fixed; feature-verifier PASS; verify-done PASS (295 tests, e2e, build)
- next: commit full uncommitted batch (emoji takeover + marketplace + brain)

## 2026-07-22 — feat-010 skills-marketplace started
- branch: `main` (uncommitted batch continues)
- in-progress feature: feat-010
- run note: `.brain/runs/2026-07-22-skills-marketplace.md`
- next: delegate data layer (skill table + repo + tRPC + seed) to recipe-runner; UI on main thread

## 2026-07-22 — portal emoji sprites + sound/timezone layout notes
- branch: `main` (uncommitted batch continues)
- changes: portal hover now projects a phosphor emoji sprite on the CRT (Work 🛠️ / Marketplace 🤖) — grayscale→green-multiply→nearest-neighbor upscale pipeline (`phosphorSprite`, cached per emoji), breathing scale, green glow, fades with eased energy (lastEmoji ref so fade-OUT keeps identity), scanlines/vignette roll over it; hover state refactored `energy` → `hovered: work|marketplace|null`; SoundToggle (with volume icons) moved top-right; GMT-7 label removed
- verified: screenshot — robot sprite reads as authentic tube graphic, typing continues above; 282 tests/typecheck/build green
- next: commit batch on user word; feat-010 marketplace

## 2026-07-21 — premium stage pass (lights, layout, sound icon)
- branch: `main` (uncommitted with retro batch)
- changes: DOM spotlight pool (radial #232328→#141416 at 50%/36%) + SVG-noise grain (opacity .05) behind scene — GPU-independent atmosphere; in-scene ContactShadows (frames=1, res 256 — context-safe) + neon pointLight phosphor spill onto hardware; identity block (role + GMT-7 + sound) moved top-LEFT; SoundToggle got IconVolume/IconVolumeOff; v3.0 moved bottom-right pairing with availability line; PORTFOLIO — 2026 stays mid-right
- verified: screenshot reviewed — spotlight + green spill + shadow read premium even in software GL; 282 tests/typecheck/build green
- next: commit both batches on user word; feat-010 marketplace

## 2026-07-21 — retro CRT pass + identity/layout notes (post-commit 58e82cc+1)
- branch: `main` (checkpoint commit made before these changes, per user)
- changes: CRT retro upgrade (rear tube hump, front vent slits, neon power LED, chunky wedge base, tube-glow radial bg, phosphor flicker, rolling scanlines, curved-glass vignette); wordmark → "Sean Stuart Urgel"; role description moved top-right above GMT-7 (was GMT+8 — user is in Calgary now) + SOUND stack; location → Calgary, Canada (en+zh); scene canvas now stops above portal bar (bottom-64/sm:bottom-40) + portal bar opaque ink; portal hover = full surface inversion (bar flips pure-white, type carbon)
- verified: screenshots reviewed (idle + hover) — CRT reads properly retro, portals no longer drowned, inversion hover strong; 282 tests/typecheck/build green
- next: commit this batch after user review; feat-010 marketplace

## 2026-07-21 — render-vanish bug fixed + boot loader shipped
- branch: `main` (no commits yet)
- root cause (user-reported "shows split second then gone"): drei `Environment preset="studio"` HDR + PMREM **lost the WebGL context** ~2.5s after load — proven by isContextLost() probe (lost:true), bisect (env off → lost:false). Replaced with procedural Lightformer env (resolution 128, frames 1, 4 softboxes) — no CDN, cheap, chrome still reflective. Context alive at t+18s post-fix.
- also shipped: ContextGuard (contextlost/restored listeners, preventDefault for restore), fullscreen BootLoader (ink plate, hairline sweep, BOOTING RENDER █) dismissed by real first frame / permanent context loss / 5s timeout; reduced-motion gated
- verified: loader shows → dismisses (probe), screenshot on-brand, typecheck/282 tests/build green
- next: user re-checks on real GPU; first commit; feat-010 marketplace

## 2026-07-21 — OBJECT_02 CRT terminal + ambient sound shipped
- branch: `main` (no commits yet)
- in-progress feature: none (home creative iteration cont.)
- shipped: chrome CRT replaces torus knot — phosphor screen live-types agentic session (crt-script.ts pure machine, +9 tests = 282), scanlines/cursor/glow, sway + parallax, energy speeds typing; ambient BGM (media-use → HeyGen catalog, 277KB faded loop, public/audio/ambient.mp3) behind gesture-gated SoundToggle
- verified: typecheck/282 tests/build green; layout screenshot clean, canvas mounts, no JS errors; CRT pixels + audio need real-GPU/user ear check
- next: user eyeball+listen; first commit; feat-010 marketplace

## 2026-07-21 — "console" home shipped (user-directed creative pass)
- branch: `main` (no commits yet)
- in-progress feature: none (home = feat-007 surface, creative iteration)
- run note: appended to `.brain/runs/2026-07-21-visual-redesign.md` scope; design amendment in design-language.md ("console" section)
- shipped: full-dark viewport stage (scene behind everything), giant typographic portal CTAs (Work/Marketplace) with hover→scene energy (knot spin-up + laser flare via spinSpeed, +5 tests = 273), view transitions on portal navigation, staggered load reveal, all motion reduced-motion-gated; home.json portals keys en+zh
- verified: idle + mobile screenshots reviewed by eye (composition lands); hover screenshot white = swiftshader compositing artifact (page alive, no JS errors — confirmed via DOM probe); typecheck/273 tests/build green
- next: user eyeballs 3D + hover flare on real GPU; first commit; feat-010 marketplace

## 2026-07-21 — visual redesign pass shipped (user rejected first visuals)
- branch: `main` (no commits yet)
- in-progress feature: none (cross-cutting visual pass over feat-007/008/009)
- run note: `.brain/runs/2026-07-21-visual-redesign.md` (closed)
- shipped: dark DOM render plate + transparent canvas (chrome-on-light was invisible), ProjectCover generative covers replace all gray voids, home recomposed (render dominates, compact headline), MacosFrame fill fix, eyebrow dedup; design-language.md amended; 268 tests + build green; self-reviewed screenshots this time
- lesson: feature-verifier asserts testids, not pixels — main thread must LOOK at screenshots before shipping UI
- next: user eyeballs 3D on real GPU; first commit; feat-010 marketplace

## 2026-07-21 — feat-009 project-case-study + feat-007 home-3d-hero SHIPPED
- branch: `main` (no commits yet — first commit pending, now spans 3 features)
- in-progress feature: none
- run notes: `.brain/runs/2026-07-21-project-case-study.md` (closed) + `.brain/runs/2026-07-21-home-3d-hero.md` (retroactive, closed — feat-007 built in parallel per user request)
- shipped: /projects/:slug (getAdjacent + getCaseStudy + WHY/HOW/SOLUTION page + 404 boundary) and / (R3F chrome-knot hero, .client-module SSR strategy); 268 tests, both feature-verifier walks PASS, verify-done brain gaps closed (i18n.md home+caseStudy sections, verification links, loader not-found pattern codified in rules/routes.md)
- outstanding: 3D pixels need one human/GPU spot check (software-WebGL sandbox renders blank); first git commit pending; feat-010 skills-marketplace last planned feature
- next: feat-010 skills-marketplace, or commit + deploy checkpoint

## 2026-07-21 — feat-009 project-case-study: server + UI implemented
- branch: `main` (no commits yet)
- in-progress feature: feat-009
- run note: `.brain/runs/2026-07-21-project-case-study.md`
- changes: `ProjectRepository.getAdjacent` (+6 tests), tRPC `projects.getCaseStudy`, route `app/routes/projects/$slug.tsx` (loader 404 handling + page ErrorBoundary), extracted `PortfolioNav`, new `splitParagraphs` helper (+6 tests), `caseStudy.*` i18n en/zh. Quality gates: typecheck PASS, 256 tests PASS (244 → 256), build PASS, harness-check 11/11.
- next: verify-done-runner full pass, then feature-verifier browser walk (golden `portfolio-v3`, null-field project, unknown-slug 404) before `/ship-feature`.

## 2026-07-21 — feat-009 project-case-study started
- branch: `main` (no commits yet)
- in-progress feature: feat-009
- run note: `.brain/runs/2026-07-21-project-case-study.md`
- baseline: green (typecheck, 244 tests, harness 11/11)
- next: extend ProjectRepository with getAdjacent + tRPC, then /projects/:slug route per design-language.md

## 2026-07-21 — feat-008 projects-showcase SHIPPED
- branch: `main` (no commits yet — first commit pending, includes whole feature)
- in-progress feature: none
- run note: `.brain/runs/2026-07-21-projects-showcase.md` (closed)
- shipped: /projects page end-to-end — project table + repo (6 tests) + schema tests (6) + tRPC projects router + grid UI + i18n; verify-done PASS (244 tests, e2e retry-green, build), feature-verifier PASS (verifications/2026-07-21.md), enforcer clean after fixes
- next: first git commit; then feat-009 project-case-study (/projects/:slug — deps satisfied) or feat-007 home 3D hero

## 2026-07-22 — feat-008 projects-showcase: /projects UI shipped (recipe-runner, add-route.md)
- branch: `main` (no commits yet)
- in-progress feature: feat-008 (status still `in-progress` — verify-done-runner + feature-verifier not yet run)
- run note: `.brain/runs/2026-07-21-projects-showcase.md` (Step 3)
- done: `/projects` route + `:lng/projects`, `macos-frame.tsx` (shared), `project-card.tsx`, `getProjectMeta` (+4 tests, 238 total), `projects` i18n ns (en+zh), new fixed portfolio design tokens in `app.css`; self-verified via Playwright script + fixed a mobile nav-overflow bug found during that walk; typecheck/test/build all green
- surfaced (not fixed, out of scope): `:lng` locale routes don't actually translate — `root.tsx` loader never reads `params.lng`; pre-existing, also affects `/zh` home
- next: verify-done-runner full pass, then feature-verifier browser-walk verdict doc, then `/ship-feature`

## 2026-07-21 — feat-008 projects-showcase started
- branch: `main` (no commits yet)
- in-progress feature: feat-008
- run note: `.brain/runs/2026-07-21-projects-showcase.md`
- baseline: typecheck PASS, 228 tests PASS; harness-check fixed (4 feature docs created) → 11/11
- next: add `project` table to `database/schema.ts` + migration + ProjectRepository per add-db-table.md

## 2026-07-21 — portfolio-v3 scaffolded from template + feature plan seeded
- branch: `main` (fresh git init, no commits yet — first commit after `bun setup`)
- in-progress feature: none
- run note: none (kickoff/coordination session)
- done: repo scaffolded from cf-saas-starter-react-router (old portfolio-v3 deleted, remote SeanningTatum/portfolio-v3 reusable); AGENTS.md overview updated; design spec written (`.brain/high-level-architecture/design-language.md`, desktop.fm monochrome + R3F chrome 3D); 4 features planned in feature_list.json (feat-007 home-3d-hero, feat-008 projects-showcase, feat-009 project-case-study, feat-010 skills-marketplace); marketplace seed data in `.brain/features/skills-marketplace/skills-inventory.md`
- next: user runs `bun setup` (Cloudflare wizard), first commit, then start feat-007 or feat-008 via /start-task

## 2026-07-15 — audit-remediation shipped
- branch: `refactor/audit-remediation` (PR opening; from main @ 8547acb)
- in-progress feature: none (cross-cutting quality task, closed)
- run note: `.brain/runs/2026-07-15-audit-remediation.md` (closed)
- shipped: 4-agent audit → 5-agent remediation (security, Effect core, DRY, i18n, +71 tests → 228), Greptile pre-PR review resolved (SVG dropped from upload allowlist, magic-byte sniffing added)
- next: merge PR; optional follow-ups — route FileUpload somewhere, feature-verifier walk of admin flow

---

## 2026-07-13 — feat-005 merged + released v1.1.0 — session end
- branch: `main` @ 4f83efc (PR #7 merged)
- in-progress feature: none
- run note: `.brain/runs/2026-07-10-preview-deployments.md` (closed)
- shipped: v1.1.0 "Every PR Gets Its Own SaaS" — per-PR preview deploys w/ isolated seeded D1, full lifecycle verified on PR #7 (open→deploy→login→close→cleanup→reopen)
- outstanding: roll CF API token (leaked to session transcript); decide keep-vs-teardown of session CF resources; run-note final edit uncommitted on main

---

## 2026-07-11 — feat-005 preview-deployments shipped
- branch: `main`
- in-progress feature: none
- run note: `.brain/runs/2026-07-10-preview-deployments.md`
- verification: per-PR D1 binding confirmed (pr-999 version upload), alias URL signup 200 with preview-D1 user row written (pr-test), prod signup 200.
- next: teardown session-provisioned resources (`bun run teardown`).

---

## 2026-07-10 — feat-005 preview-deployments added to feature_list.json (in-progress)
- branch: `main`
- in-progress feature: feat-005 (preview-deployments)
- run note: `.brain/runs/2026-07-10-preview-deployments.md`
- next: registered in `feature_list.json` + `.brain/features/preview-deployments.md` created; continue implementation per run note.

---

## 2026-07-10 — Preview deployments + DX (research → implement) — in progress
- branch: `main`
- in-progress feature: feat-005 (preview-deployments, to be added to feature_list)
- run note: `.brain/runs/2026-07-10-preview-deployments.md`
- baseline: typecheck FAIL + harness-check FAIL — both pre-existing, caused by intentionally-absent `wrangler.jsonc` (generated by `bun run setup`); tests 123/123 PASS
- blocker: wrangler OAuth expired — user must `wrangler login` before provisioning
- next: consume research-agent reports, provision CF env non-interactively, design preview-deploy pipeline

---

## 2026-05-07 — Effect-TS API audit: rules + boundary refactor + bulk ops + logging — closed
- branch: `main`
- in-progress feature: none
- run note: none (rule + targeted code edits)
- scope: surveyed API surface for Effect-TS idiom gaps, codified rules, applied where it mattered, left simple CRUD untouched.

### Rule additions
- **HTTP boundary (non-tRPC) pattern** in `rules/routes.md` — `runPromiseExit` + `Exit.match` + `Effect.catchTag(s)`, no `try`/`catch`. Recoverable in catches, defects in `onFailure`. Anti-patterns: try/catch around runPromise, duck-typing `TRPCError.code`.
- **`Effect.promise` vs `Effect.tryPromise`** table in `rules/services.md` — `tryPromise` for any fallible promise (Better Auth, fetch, drizzle, third-party); `promise` only for known-infallible.
- **Procedure-level error transformation** section in `rules/routes.md` with operator table (`catchTag(s)` / `retry` / `partition` / `tap` / `tapErrorTag` / `timeout`) + worked `deleteUser` example. Default = fall-through; only transform for complex procedures.
- **Logging — Effect logger vs imperative `loggers.X`** in `rules/services.md` — same sink (`emitLog` via `LoggerLive`); pick by context. Effect inside `Effect.gen`, imperative outside. Canonical shape `Effect.logInfo("event").pipe(Effect.annotateLogs({...}))`; never `logInfo({...}, "event")` (fields would JSON-stringify into message string).
- Cross-refs added in `codebase/effect-ts.md` "What Not To Do" + `rules/errors.md` "Using errors in tRPC procedures".
- New anti-patterns: `?.` on `ctx.auth.user` after protected/adminProcedure, `Effect.promise` for fallible work.

### Code changes
- `app/routes/api/upload-file.ts` — rewritten to `runPromiseExit` + `Exit.match` + `Effect.catchTag("ValidationError")`. Removed try/catch + duck-typed `TRPCError.code`. `app/components/file-upload.tsx` narrows `fetcher.data` with `"success" in` / `"key" in` guards.
- `app/trpc/routes/admin.ts` — `bulkBanUsers` / `bulkDeleteUsers` / `bulkUpdateUserRoles` now (1) return idempotent `{ success: true, affectedCount: 0, skippedCount }` on no-valid (was: 400 ValidationError — wrong semantics, input was valid), (2) emit structured audit log via `Effect.tap` + `Effect.logInfo("users.bulk_*").pipe(Effect.annotateLogs({ actor, targets, affectedCount, skippedCount, ... }))`.
- `app/lib/effect-trpc.ts` `runProcedure` — wraps every procedure in `Effect.annotateLogs({ layer: "trpc" })` for auto layer-tag parity with imperative `loggers.trpc`.

### Skipped (intentionally)
- Procedure refactors for simple CRUD — default `tagToTRPC` fall-through is correct.
- Helper extraction for bulk ops — defer until 4th lands.
- `Effect.partition` per-user in bulk — single bulk UPDATE keeps atomicity; partial-success UX not needed for ban.

### Still open (separate task)
- `app/trpc/index.ts:14-18` — `Effect.promise` → `Effect.tryPromise` for Better Auth `getSession`.
- `app/trpc/router.ts:43` — redundant `?.` on `ctx.auth.user`.

### Verify
- typecheck PASS, unit 123/123 PASS at every checkpoint.

---

## 2026-05-07 — Boilerplate UI polish v3 (Mandarin + live toggle + e2e cleanup) — closed
- branch: `main`
- in-progress feature: none
- run note: `.brain/runs/2026-05-07-boilerplate-ui-polish.md`
- verify: typecheck + unit (123/123) + e2e (auth.spec 2/2) PASS
- changes: added zh locale (6 ns files), `LanguageSwitcher` wired into home / auth / dashboard, new `/api/set-locale` action, replaced docs+i18n e2e specs with focused `auth.spec.ts`, fixed live-toggle race via `useFetcher` + root revalidation
- next: none — to add a locale, drop `app/locales/<lng>/*.json` + add to `supportedLngs` + add label to LanguageSwitcher.

---

## 2026-05-07 — Boilerplate UI polish v2 (harness section + v2 label) — closed
- branch: `main`
- in-progress feature: none (cross-cutting polish over feat-001, feat-002)
- run note: `.brain/runs/2026-05-07-boilerplate-ui-polish.md`
- verify: typecheck + unit PASS (123/123), e2e i18n 6/8 (same 2 pre-existing fails — no regression)
- changes: hero eyebrow → v2; new "An agent harness, not just a stack" section on `/` with 3 pillars + commands block; `meta.description` updated; new `home.harness.*` i18n keys.
- next: replace placeholder GitHub URLs with real repo on publish; pre-existing 404 i18n namespace + dead docs.spec follow-up.

---

## 2026-05-07 — Boilerplate UI polish (home / login / dashboard) — closed
- branch: `main`
- in-progress feature: none (cross-cutting polish over feat-001, feat-002)
- run note: `.brain/runs/2026-05-07-boilerplate-ui-polish.md`
- baseline: PASS; verify: typecheck + unit PASS, e2e i18n 6/8 (2 pre-existing fails unrelated), docs.spec dead (pre-existing)
- shipped: refero-synthesized `design-system.md`; redesigned home / login / sign-up / dashboard with split-pane auth + educational cards; new `StackBadge` + `AuthShell` components.
- next: replace placeholder GitHub URLs with real repo on publish; fix pre-existing 404 i18n namespace bug + dead docs.spec in a follow-up.

---

## 2026-05-07 — Harness hardening pass
- branch: `feat/effect-ts`
- in-progress feature: harness itself (no feat-id; meta)
- run note: none
- changes: type-locked `tagToTRPC` (AppError + assertNever), `harness-check.sh` brain dead-link check + wired into `init.sh --baseline`, added `.github/workflows/ci.yml` (baseline + build + e2e + non-negotiables grep), `99-verify-done.md` flipped e2e default-on, `HARNESS.md` Verification table updated, `add-tagged-error.md` recipe updated for AppError union requirement
- next: commit + push to exercise CI on first PR

---

## 2026-05-07 — Harness upgrade (5-subsystem alignment)
- branch: `feat/effect-ts`
- in-progress feature: harness itself (no feat-id; meta)
- run note: none
- changes: added `feature_list.json`, `init.sh`, this `progress.md`, `HARNESS.md`, sub-agents in `.claude/agents/`, SessionStart hook
- next: verify init.sh runs clean → commit harness upgrade
