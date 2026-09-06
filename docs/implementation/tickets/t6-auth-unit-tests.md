---
parent: docs/eng-review-plan.md
labels: [implementation, task, testing]
task_id: T6
created: 2026-09-05
state: done
estimate_human: ~3h
estimate_cc: ~20min
surfaced_by: Test coverage diagram — auth flows all GAP
---

## What

Write unit tests for auth routes: register and login.

## Files

- `app/api/auth/register/route.test.ts`
- `app/api/auth/login/route.test.ts`

## Test Cases

### Register (`POST /api/auth/register`)
- [ ] Duplicate email → returns 409
- [ ] Invalid email (not @ai-passport.go.th) → returns 400
- [ ] Password too short (< 8 chars) → returns 400
- [ ] Missing required fields → returns 400
- [ ] Valid registration → returns 201, no body (stateless JWT)
- [ ] Non-POST method → returns 405

### Login (`POST /api/auth/login`)
- [ ] Wrong password → returns 401
- [ ] User not found → returns 401
- [ ] Valid login → returns 200, sets HttpOnly JWT cookie
- [ ] Rate limited (5+ attempts/IP/15min) → returns 429
- [ ] Non-POST method → returns 405

## Framework

Vitest (bundled with Next.js). Mock D1 binding and KV for rate limit counter.

## Verify

`bun test` passes all auth tests with > 80% branch coverage.

## Dependencies

- T3 (bcrypt cost 10)
- T4 (auth routes implemented)
