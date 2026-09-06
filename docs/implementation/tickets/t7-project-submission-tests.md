---
parent: docs/eng-review-plan.md
labels: [implementation, task, testing]
task_id: T7
created: 2026-09-05
state: done
estimate_human: ~2h
estimate_cc: ~15min
surfaced_by: Test coverage diagram — project submission validation GAP
---

## What

Write unit tests for project submission: validation, success, and error cases.

## Files

- `app/api/projects/route.test.ts`

## Test Cases

### Create Project (`POST /api/projects`)
- [ ] Unauthenticated → returns 401
- [ ] Screenshot too large (> 5MB) → returns 413
- [ ] Invalid URL format → returns 400
- [ ] Title too long (> 100 chars) → returns 400
- [ ] Tag count > 10 → returns 400
- [ ] Valid project → returns 201 with project object
- [ ] Non-POST method → returns 405

### List Projects (`GET /api/projects`)
- [ ] Filter by tag → verifies correct SQL index usage
- [ ] Sort by newest → verifies ORDER BY
- [ ] Sort by most viewed → verifies view_count sort
- [ ] Pagination → verifies LIMIT/OFFSET

## Framework

Vitest. Mock D1 binding.

## Verify

`bun test` passes project tests with > 80% branch coverage.

## Dependencies

- T2 (project_tags table)
- T5 (project routes implemented)
