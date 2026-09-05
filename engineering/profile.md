---
name: ai-passport-marketplace
description: AI Passport Marketplace — product hub for Thai AI Passport graduates on Cloudflare Pages
created: 2026-09-05
---

## Project Profile

Discipline:      full-stack (Next.js FE + Cloudflare Workers BE)
Role default:     lead
Repos:            ai-passport-marketplace (implement)
Implement scope:  all
engineering/ at:  /Users/poom-work/ai-passport-marketplace/engineering/
Workspace exposure: gitignored (greenfield, no code yet)
Platform:         macOS 25.5.0 arm64, zsh
Agent access:     direct (file tools)
Trivial changes:  new branch always
Commit attribution: none

## Preferences

- Commits: summarize-and-wait (gate) per run
- Loop: step (one task at a time, review between tasks)
- Agents: single (sequential implementation)

## Stack

- Next.js (Cloudflare Pages adapter)
- Cloudflare D1 (SQLite at edge)
- Cloudflare R2 + Cloudflare Images (storage)
- Cloudflare Workers (upload proxy)
- JWT auth (stateless, 7-day, bcrypt cost 10)
- Vitest (unit tests)
- Playwright (E2E tests)
- Bun (package manager + test runner)
