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

Every agent session starts from zero — re-reading the codebase, re-deriving what's in flight, sometimes re-litigating a decision it already made and forgot. I wanted to learn whether that institutional memory could live in the repo itself, and, more curiously, what an interface built for an *agent* to read — not a human — actually looks like when you design it honestly.

## HOW

`brain` is a single-file, zero-dependency Node CLI over a `.brain/` directory checked into git like any other code — features, checkpoints, rules, recipes, run notes, plan reviews. The whole bet is the output format: [TOON](https://toonformat.dev/) instead of JSON or prose, with pre-computed counts, truncated bodies behind a `--full` flag, and a `help:` block on every command that teaches the agent its next move. The CLI's own output is how a fresh agent learns to use it — no MCP server, no daemon, no API key.

## SOLUTION

Install the skill once and just work — the agent discovers the right command mid-task and writes to the brain as a side effect of doing its job, with a companion web surface for human plan review and live execution dashboards over SSE. What I took away: designing for an LLM reader inverts your instincts. Terseness, definitive empty states, and always naming the next action beat the human-friendly verbosity I'd have reached for by default.
