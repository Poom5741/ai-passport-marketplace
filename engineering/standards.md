---
name: ai-passport-marketplace-standards
description: Coding standards for AI Passport Marketplace
created: 2026-09-05
---

## Stack

Language:     TypeScript
Runtime:      Cloudflare Workers / Pages (Next.js adapter)
Database:     D1 (SQLite edge)
Storage:      R2 + Cloudflare Images
Test runner:  Bun (`bun test`)
E2E runner:   Playwright (`npx playwright test`)
Linter:       ESLint
Formatter:    Prettier

## Conventions

- Route files: `app/api/<resource>/route.ts` (Next.js App Router)
- Auth helpers: `lib/auth.ts` (JWT sign/verify, bcrypt hash)
- DB helpers: `lib/d1.ts` (parameterized queries)
- Tag normalization: `lib/tags.ts` (`normalizeTags()`)
- Upload Worker: `workers/upload/index.ts`
- Migration files: `drizzle/migrations/`
- Schema: `drizzle/schema.ts`
- Test files: co-located with source as `*.test.ts`
- E2E tests: `tests/e2e/<flow>.spec.ts`

## Domain Terms

- `project_tags` — join table (project_id, tag) with index on tag
- `waitUntil` — Cloudflare Workers fire-and-forget for non-blocking writes
- presigned URL — R2 pre-authenticated URL (not applicable; Worker proxies uploads)
- bcrypt cost 10 — OWASP minimum, fast enough for Workers 50ms CPU limit

## Branch format

`task/<ticket>` — e.g. `task/T1-cloudflare-images`

## Commit format

Conventional commits: `feat/`, `fix/`, `test/`, `docs/`
