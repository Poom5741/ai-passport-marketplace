---
parent: docs/eng-review-plan.md
labels: [implementation, task]
task_id: T3
created: 2026-09-05
state: open
estimate_human: ~1h
estimate_cc: ~5min
surfaced_by: A4 (bcrypt cost decision)
---

## What

Update `bcrypt` cost from default 12 (or any higher value) to cost 10 in `lib/auth.ts`.

## Why

Workers CPU limits are tight. bcrypt cost 12 can exceed the 50ms CPU allowance on the free tier. Cost 10 is the OWASP minimum — still secure for a learner showcase with no high-value targets.

## Files

- `lib/auth.ts`

## How

Locate `bcrypt.hash` calls. Change rounds/cost parameter to `10`. Example:
```ts
const hash = await bcrypt.hash(password, 10);
```

## Verify

Register a user, time `bcrypt.hash` — should complete in < 200ms. Confirm hashed value starts with `$2a$10$` or `$2b$10$`.

## Dependencies

- None (auth library already exists)
