# README Generation Prompt — Marketplace Skills

**How to use:** Copy the prompt below into `SeanningTatum/marketplace` — either save it as a slash command at `.claude/commands/generate-skill-readmes.md` and run `/generate-skill-readmes`, or paste it directly into a Claude Code session opened at the repo root. It's self-contained: run once to generate READMEs for every skill, or narrow it ("just do `pr-format`") to target one skill per session.

---

## The prompt

```
You are working in the SeanningTatum/marketplace repo. It hosts Claude Code
plugins, each with one or more skills at plugins/<plugin>/skills/<skill>/,
each containing a SKILL.md (frontmatter: name, description + instructions
body).

Goal: write plugins/<plugin>/skills/<skill>/README.md for every real skill
in the repo (skip plugins/*/skills/example-skill — it's a template, not a
shipped skill).

For EACH skill, do this:

1. READ the skill's SKILL.md in full, plus any file it references (scripts,
   templates, other docs in the skill folder). Understand: what it actually
   does, what triggers it (its slash-command name and any natural-language
   invocations named in the description), what inputs it needs (arguments,
   repo state, external tools like `gh`), and what it produces.

2. WRITE plugins/<plugin>/skills/<skill>/README.md with EXACTLY these
   sections, in this order. Do not add extra top-level sections.

   # <Skill Title>
   One-line tagline (not a repeat of the H1) — the single sentence that
   sells what this does.

   ## WHAT
   What the skill does, its trigger/invocation (the slash command, e.g.
   `/pr-format`, plus any phrases that also invoke it), and its inputs/
   outputs. ≤100 words. Concrete, not marketing.

   ## WHY
   The problem it solves and the pain before it existed — what a person did
   by hand, badly or slowly, without this. When to reach for it vs. doing
   it manually or vs. a related skill in this repo (name the alternative
   skill if one exists). ≤120 words.

   ## HOW
   Step-by-step: the actual workflow the skill runs (mirror the numbered
   steps in SKILL.md, don't invent new ones), then a realistic usage
   example showing the invocation and a representative output snippet
   (a real command + real-shaped output, e.g. a triage table, a PR body,
   a terminal transcript). This section can run longer than the others —
   it's the proof the skill works, not just a claim.

   ## Screenshots
   Real screenshots where they exist; otherwise placeholder image tags so
   the slot is reserved. For each shot:
   - `![<what it shows>](./screenshots/<name>.png)` followed by a one-line
     caption of what the screenshot demonstrates.
   - If the real screenshot doesn't exist yet, keep the image tag but add
     `<!-- TODO: capture -->` right above it, and write the caption as an
     instruction for what to capture (e.g. "terminal running /pr-format on
     a real open PR, showing the before (raw diff) and after (formatted
     body) side by side").
   - If the skill produces terminal/CLI output, the shot list must call
     for a REAL run captured from the terminal — never describe or ask
     for a mockup/staged screenshot.
   - Aim for 2-3 shots per skill: typically (a) the invocation, (b) the
     key intermediate step if there is one worth seeing (e.g. a P1/P2/P3
     triage table), (c) the final artifact/output.

3. STYLE RULES for every README:
   - Skimmable: short paragraphs, bullets over prose, headers as promised.
   - Concrete over abstract — name real files, real commands, real flags.
     No "streamlines your workflow" / "powerful" / "seamless" filler.
   - Any runnable command or literal output goes in a fenced code block.
   - Keep WHAT and WHY inside their word limits; don't pad HOW to fill
     space, but don't shortchange the example either.

Two grounding examples already in this repo (read these two SKILL.md files
first, before starting, so your section-writing calibrates to real content
rather than generic skill-README boilerplate):
- plugins/engineering-toolkit/skills/pr-format/SKILL.md — a structure-
  enforcing formatter skill (WHY/WHAT/HOW/SOLUTION/... template, "Rules",
  a "Minimal example" at the end). Its README's WHY should contrast
  formatted vs. thin auto-generated PR bodies; its HOW example should show
  a real formatted PR body like the "Minimal example" block in the SKILL.md.
- plugins/engineering-toolkit/skills/resolve-comments/SKILL.md — a
  triage-and-escalate skill (P1/P2/P3 ruleset, an 8-step workflow, ends by
  re-triggering Greptile). Its README's HOW should walk the same
  P1/P2/P3 triage and show a representative triage-table snippet as the
  "realistic usage example" output.

Apply that same level of specificity to every other skill (client-review,
create-pr-with-review, new-app, release — plus anything else found under
plugins/*/skills/ at run time, minus example-skill).

4. AFTER all READMEs are written, print ONE consolidated shot list: every
   screenshot across every skill that still needs to be captured (i.e.
   every image tag you marked <!-- TODO: capture -->), grouped by skill,
   each line stating exactly what to capture and where it saves
   (plugins/<plugin>/skills/<skill>/screenshots/<name>.png). This is the
   deliverable Sean uses to go capture real screenshots afterward — do not
   fabricate images, just reserve the slots and list what's missing.

Definition of done:
- [ ] Every non-template skill under plugins/*/skills/ (i.e. all except
      */example-skill) has a README.md with all 4 sections in the exact
      order above.
- [ ] Every image path is relative (./screenshots/<name>.png), never
      absolute or repo-rooted.
- [ ] Every screenshot without a real image has <!-- TODO: capture --> and
      a caption written as a capture instruction, not a fake description.
- [ ] The consolidated shot list is printed at the end, one line per
      missing screenshot, grouped by skill.
- [ ] example-skill folders are untouched (no README added there).
```

---

**Skills this currently covers** (verify against the live repo at run time —
new skills may have been added since): `plugins/engineering-toolkit/skills/`
`client-review`, `create-pr-with-review`, `new-app`, `pr-format`, `release`,
`resolve-comments`; `plugins/automation-toolkit/skills/` — skip
`example-skill` here too if the toolkit only has the template so far.
