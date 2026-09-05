---
parent: docs/eng-review-plan.md
labels: [implementation]
created: 2026-09-05
state: open
---

## Implementation Tickets

All 9 tasks from the eng review plan, promoted to first-class ticket files.

| ID | Title | State | Estimate | Dependencies |
|----|-------|-------|---------|-------------|
| [T1](tickets/t1-cloudflare-images-setup.md) | Cloudflare Images setup | OPEN | ~1h | None |
| [T2](tickets/t2-project-tags-table.md) | project_tags DDL | OPEN | ~30min | T1 |
| [T3](tickets/t3-bcrypt-cost-10.md) | bcrypt cost 10 | OPEN | ~1h | None |
| [T4](tickets/t4-worker-proxy-upload.md) | Worker proxy upload | OPEN | ~2h | T1 |
| [T5](tickets/t5-waituntil-view-counts.md) | waitUntil view counts | OPEN | ~1h | T1 |
| [T6](tickets/t6-auth-unit-tests.md) | Auth unit tests | OPEN | ~3h | T3, T4 |
| [T7](tickets/t7-project-submission-tests.md) | Project submission tests | OPEN | ~2h | T2, T5 |
| [T8](tickets/t8-e2e-tests.md) | E2E tests | OPEN | ~2h | T6, T7 |
| [T9](tickets/t9-tag-normalization-tests.md) | Tag normalization tests | OPEN | ~2h | — |

## Order

```
T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8 → T9
```

T1 must go first (everything depends on cloud setup). T6-T9 (tests) can run once the app is scaffolded.
