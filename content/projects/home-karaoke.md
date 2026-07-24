---
slug: home-karaoke
title: Home Karaoke
summary: Group karaoke for house parties — host on the TV, guests queue from their phones.
category: experiment
year: 2026
stack: ["cloudflare-workers", "durable-objects", "react-router", "effect-ts"]
role: Solo builder
thumbnailUrl: /projects/home-karaoke/thumb.png
featured: false
sortOrder: 4
client: Open source
heroImageUrl: /projects/home-karaoke/hero.png
stats: [{ "label": "Realtime", "value": "Durable Objects" }, { "label": "Guest device", "value": "Phone + QR" }]
---

## WHY

House-party karaoke always collapses onto one person hunched over a laptop, playing human jukebox while everyone else waits. The itch was social, but the thing I actually wanted to learn was technical: could I make a shared room feel genuinely *live* — a song added on someone's phone showing up on the TV instantly — and let Durable Objects carry the realtime state instead of hand-rolling it?

## HOW

The host opens a room on the big screen; guests scan a QR to join and search YouTube from their phones. A Cloudflare Durable Object holds each room's live state — the queue, who's up, playback — and fans updates to every connected device over WebSockets, so the phone is the remote and the TV is the show. React Router v7 on Workers front to back, Effect TS for the service layer.

## SOLUTION

A self-hostable karaoke room with a shared queue, live emoji reactions, and a between-songs recap card — no app to install, nothing to plug in but a browser. The takeaway: Durable Objects made "one authoritative room, many live screens" almost boring to build — which is exactly the compliment you want to pay a piece of infrastructure.
