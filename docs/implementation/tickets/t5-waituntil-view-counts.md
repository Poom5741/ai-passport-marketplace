---
parent: docs/eng-review-plan.md
labels: [implementation, task]
task_id: T5
created: 2026-09-05
state: done
estimate_human: ~1h
estimate_cc: ~10min
surfaced_by: P2 (fire-and-forget view counting)
---

## What

Wrap view count D1 writes in `waitUntil()` in the project and profile view endpoints. View increment fires after response is sent — user never waits.

## Why

D1 write on every page view would block the response and add ~50-200ms latency. `waitUntil` defers the write to after the response is delivered.

## Files

- `app/api/projects/[id]/route.ts`
- `app/api/users/[id]/route.ts`

## How

```ts
// In the response handler, before return:
waitUntil(
  env.DB.prepare(
    'UPDATE projects SET view_count = view_count + 1 WHERE id = ?'
  ).bind(projectId).run()
);
return response;
```

Same pattern for profile views on `app/api/users/[id]/route.ts`.

## Verify

Response time unchanged with/without view increment. View count eventually increases in D1 after page load.

## Dependencies

- T1 (D1 schema exists)
