---
slug: day-trader
title: Day Trader
summary: Paper-trading simulator with live market data and a leaderboard.
category: experiment
year: 2025
stack: ["next.js", "postgres", "websockets"]
role: Full-stack engineer
featured: false
sortOrder: 5
---

## WHY

I wanted an excuse to work with live streaming data — real-time prices pushing to the browser — without risking real money to learn it. Paper trading with a leaderboard turned a plumbing exercise into something I'd actually keep opening: markets are a fun forcing function for latency, and losing fake money stings just enough to make the state model feel real.

## HOW

A Next.js front end over a Postgres-backed portfolio and order model; a WebSocket layer streams live market quotes to every open client and settles simulated trades against them, with a leaderboard ranking players by paper P&L.

## SOLUTION

A paper-trading game where the data is real but the losses aren't. What I took away: streaming to many clients is less about the socket and more about deciding what's authoritative on the server — the same lesson that, a year later, made Home Karaoke's Durable Objects click immediately.
