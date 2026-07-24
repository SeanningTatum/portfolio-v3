---
slug: portfolio-v3
title: portfolio-v3
summary: This site — built as a live demo of the stack I ship, not a description of it.
category: saas
year: 2026
stack: ["react-router", "cloudflare-workers", "effect-ts", "d1", "trpc"]
role: Solo builder
thumbnailUrl: /projects/portfolio-v3/thumb.png
featured: true
sortOrder: 0
client: Personal
heroImageUrl: /projects/portfolio-v3/hero.png
stats: [{ "label": "Unit tests", "value": "234+" }, { "label": "Cold start", "value": "<50ms" }]
---

## WHY

The interesting question wasn't "what should a portfolio say" — it was "can the portfolio *be* the proof?" I ship client work on Cloudflare and Effect TS, and I wanted to run that whole stack for myself, end to end, to feel where it's genuinely sharp and where I'm just tolerating it. A personal site was the perfect low-stakes place to find out.

## HOW

Built on the same production stack I ship to clients: Workers + React Router v7 + tRPC + D1/Drizzle + Better Auth + Effect TS. Every repository is an Effect.Service with typed tagged errors; every route runs through runProcedure, so failures surface as typed codes instead of leaking stack traces. The whole thing is driven by a `.brain/` harness — recipes, rules, and per-feature docs an AI collaborator reads before it touches code.

## SOLUTION

A portfolio that doubles as a working reference implementation — real auth, a real database, 200+ tests. The takeaway that surprised me: the harness earned its keep more than any single feature did. Writing conventions down once, where an agent reads them first, is what stopped a solo build from drifting a little further off-course every session.
