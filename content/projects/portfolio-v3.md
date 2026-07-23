---
slug: portfolio-v3
title: portfolio-v3
summary: This site — a Cloudflare-native portfolio with a real backend.
category: saas
year: 2026
stack: ["react-router", "cloudflare-workers", "effect-ts", "d1", "trpc"]
role: Solo builder
featured: true
sortOrder: 0
client: Personal
stats: [{ "label": "Unit tests", "value": "234+" }, { "label": "Cold start", "value": "<50ms" }]
---

## WHY

Most portfolios are static marketing pages. I wanted mine to double as a demonstration of the exact stack I ship for clients — real auth, a real database, real tests — not a Notion export.

## HOW

Built on the Cloudflare SaaS stack: Workers + React Router v7 + tRPC + D1/Drizzle + Better Auth + Effect TS. Every repository is an Effect.Service with typed tagged errors; every route runs through runProcedure so failures translate into typed tRPC codes instead of leaking stack traces.

## SOLUTION

A harness-driven codebase where the brain (.brain/) is as load-bearing as the code — recipes, rules, and per-feature docs keep an AI collaborator (or a future me) from re-deriving conventions from scratch every session.
