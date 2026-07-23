---
slug: cf-saas-starter
title: CF SaaS Starter
summary: Opinionated template for shipping SaaS on Cloudflare Workers.
category: tooling
year: 2025
stack: ["react-router", "cloudflare-workers", "effect-ts", "better-auth"]
role: Author & maintainer
featured: false
sortOrder: 1
client: Open source
stats: [{ "label": "GitHub stars", "value": "120+" }]
---

## WHY

Every new Cloudflare side project meant re-wiring D1, auth, and tRPC from zero. Wanted a template that encoded the decisions once.

## HOW

Extracted the auth + repository + error-handling patterns from client work into a reusable `bun create` template with Better Auth, Drizzle/D1, and an Effect TS service layer pre-wired.

## SOLUTION

A starter that gets a new Cloudflare SaaS from `git clone` to a working signup flow in under ten minutes.
