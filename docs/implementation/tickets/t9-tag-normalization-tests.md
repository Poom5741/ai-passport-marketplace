---
parent: docs/eng-review-plan.md
labels: [implementation, task, testing]
task_id: T9
created: 2026-09-05
state: open
estimate_human: ~2h
estimate_cc: ~15min
surfaced_by: Test coverage diagram — tag normalization GAP
---

## What

Write unit tests for tag normalization: lowercase, dedupe, max 10.

## Files

- `lib/tags.test.ts` (or wherever tag normalization logic lives)

## Test Cases

### Tag normalization (`normalizeTags()`)
- [ ] Uppercase input → lowercase output
- [ ] Leading/trailing whitespace → trimmed
- [ ] Duplicate tags → deduped (set semantics)
- [ ] Empty string tag → filtered out
- [ ] More than 10 tags → truncated to 10
- [ ] Exactly 10 tags → all kept
- [ ] Special characters → preserved (tags can contain hyphens, underscores)
- [ ] Thai/unicode characters → preserved
- [ ] Empty array → returns []

## Framework

Vitest.

## Verify

`bun test` passes tag normalization tests with > 80% branch coverage.

## Dependencies

- Tag normalization logic implemented in `lib/tags.ts`
