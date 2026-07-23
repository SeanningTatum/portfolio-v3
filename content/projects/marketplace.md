---
slug: marketplace
title: marketplace
summary: Claude Code skills that ship code, not just suggestions.
category: tooling
year: 2026
stack: ["claude-code", "plugins", "agent-skills", "bash"]
role: Author & maintainer
thumbnailUrl: /projects/marketplace/thumb.svg
featured: false
sortOrder: 2
client: Open source
heroImageUrl: /projects/marketplace/hero.gif
stats: [{ "label": "Plugins", "value": "2" }, { "label": "Skills", "value": "8" }]
---

## WHY

Most AI coding help stops at a suggestion — it tells you what to do, then leaves the actual shipping to you. I wanted skills that close the loop: scaffold the app, open the PR, resolve the review, cut the release. The last mile, automated.

## HOW

A personal, actively-developed Claude Code plugin marketplace with two plugins. `engineering-toolkit` is the ship-it loop end to end — scaffold a new app from a template, open a browser-verified and AI-reviewed PR, triage review comments by severity, and cut a branded release. `marketing-toolkit` is the polish layer — rewrite a README in marketing-grade language with real screenshots of every surface, and mock up output visuals when there's no live demo to capture.

## SOLUTION

One slash command per step of the real engineering workflow. Every skill ships a README with its what / why / how and a visual of the output, so a reviewer — or a future me — sees exactly what it produces before running it. Installed with a single `/plugin marketplace add`.
