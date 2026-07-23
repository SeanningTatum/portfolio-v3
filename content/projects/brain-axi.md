---
slug: brain-axi
title: brain-axi
summary: A CLI that gives coding agents durable, cross-session memory.
category: tooling
year: 2026
stack: ["node", "cli", "agent-skills", "toon"]
role: Author & maintainer
thumbnailUrl: /projects/brain-axi/thumb.png
featured: true
sortOrder: 1
client: Open source
heroImageUrl: /projects/brain-axi/hero.png
stats: [{ "label": "Dependencies", "value": "0" }, { "label": "Ships as", "value": "1 file" }]
---

## WHY

Every new agent session starts from zero. It re-reads the codebase, re-derives what's in progress, re-asks "what did we decide last time" — and sometimes forgets a decision was ever made and re-litigates it. Context windows reset; institutional memory shouldn't.

## HOW

`brain` is a single-file, zero-dependency Node CLI that reads and writes a `.brain/` directory checked into the repo like any other code — features, progress checkpoints, rules, recipes, run notes, plan reviews. Output is [TOON](https://toonformat.dev/), not JSON or prose: pre-computed counts, truncated bodies with a `--full` escape hatch, and a `help:` block at the end of every command that teaches the agent what to run next. Agents shell out to it; no MCP server, no daemon, no API key.

## SOLUTION

Install the skill once and work normally — when you ask an agent to plan a feature, check what's in progress, or record where it left off, it discovers the right `brain` command and runs it. You get a queryable project brain as a side effect of the agent doing its job. A companion web surface renders plans for human review and streams execution dashboards live over SSE.
