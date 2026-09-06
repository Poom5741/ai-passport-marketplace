---
parent: docs/eng-review-plan.md
labels: [implementation, task, testing]
task_id: T8
created: 2026-09-05
state: done
estimate_human: ~2h
estimate_cc: ~15min
surfaced_by: Test coverage diagram — E2E flows GAP
---

## What

Write Playwright E2E tests covering full user registration to project submission flows.

## Files

- `tests/e2e/register-submit.spec.ts`

## Test Cases

### Registration flow
- [ ] Register with valid @ai-passport.go.th email → redirect to profile → see empty state
- [ ] Register with duplicate email → error message displayed
- [ ] Register with invalid email domain → error message

### Project submission
- [ ] Submit with all fields → project appears in public feed
- [ ] Submit without screenshot → still saves (screenshot is optional)
- [ ] Submit with 11 tags → returns 400 error
- [ ] Submit with no live URL → still saves (live_url is optional)

### View counting
- [ ] Same visitor within 1 hour = no new view increment
- [ ] Different visitor = new increment

## Framework

Playwright. Runs against local Cloudflare Pages preview or dev.

## Verify

`npx playwright test` passes all E2E tests.

## Dependencies

- T6 (auth tests pass)
- T7 (project tests pass)
- App is deployable (T1-T5 complete)
