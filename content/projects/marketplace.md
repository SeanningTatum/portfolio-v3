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

Most AI coding help stops at advice — it tells you what to do and leaves the doing to you. I wanted to find out how much of my *actual* engineering loop I could hand off end to end: scaffold, open the PR, resolve the review, cut the release. Less "assistant," more "teammate who finishes the task and shows their work."

## HOW

A personal, actively-developed Claude Code plugin marketplace with two plugins. `engineering-toolkit` is the ship-it loop — scaffold a new app from a template, open a browser-verified and AI-reviewed PR, triage review comments by severity, cut a branded release. `marketing-toolkit` is the polish layer — rewrite a README with real screenshots of every surface, and mock up output when there's no live demo to capture. One slash command per step of the real workflow.

## SOLUTION

Skills I actually reach for on my own repos every week — this very PR was opened by one of them. The lesson: the leverage isn't the AI writing code, it's automating the unglamorous connective tissue *around* the code — the verify, the review, the formatting — the steps I'd otherwise cut when I'm tired and want to be done.
