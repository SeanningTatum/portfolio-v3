---
slug: cf-saas-starter
title: CF SaaS Starter
summary: Opinionated template for shipping SaaS on Cloudflare Workers.
category: tooling
year: 2025
stack: ["react-router", "cloudflare-workers", "effect-ts", "better-auth"]
role: Author & maintainer
thumbnailUrl: /projects/cf-saas-starter/thumb.png
featured: false
sortOrder: 3
client: Open source
heroImageUrl: /projects/cf-saas-starter/hero.gif
stats: [{ "label": "Stack pieces", "value": "7" }, { "label": "Clone to signup", "value": "<10 min" }]
---

## WHY

Every new Cloudflare side project started the same way: re-wire D1, auth, tRPC, and the error layer from scratch before I'd written a single line of the actual idea. I wanted to encode those decisions once — and, honestly, to learn which of my "obvious" patterns really generalize versus which ones I quietly re-litigate on every repo.

## HOW

Extracted the auth, repository, and error-handling patterns from client work into a `bun create` template — Better Auth, Drizzle/D1, and an Effect TS service layer pre-wired, running on the same runtime locally and in production. Tagged errors map to tRPC codes out of the box, and a `.brain/` harness ships with it so an agent can extend the app without re-deriving the conventions first.

## SOLUTION

A starter that gets a new Cloudflare SaaS from `git clone` to a working signup in under ten minutes. What building it taught me: the hard part of a template isn't the code, it's restraint — every opinion you bake in is one the next project has to either live with or tear out, so the discipline is knowing what to leave *unopinionated*.
