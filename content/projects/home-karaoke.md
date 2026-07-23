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

House-party karaoke always devolves into one person hunched over a laptop being the human jukebox. Everyone else waits. I wanted the room to run itself — anyone can add a song, the queue is shared, and the TV is the only screen that matters.

## HOW

The host opens a room on the big screen; guests scan a QR to join and search YouTube from their phones. A Cloudflare Durable Object holds each room's live state — the queue, who's up, playback — and fans updates out to every connected device over WebSockets, so a song added on a phone appears on the TV instantly. React Router v7 on Workers front to back, Effect TS for the service layer.

## SOLUTION

A self-hostable karaoke room where the phone is the remote and the TV is the show — shared queue, live reactions, and a between-songs recap card, with no app to install and nothing to plug in but a browser.
