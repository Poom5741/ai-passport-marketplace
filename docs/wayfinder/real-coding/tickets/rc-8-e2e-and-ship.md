---
parent: ../map.md
labels: [task]
task_id: rc-8
created: 2026-09-06
state: open
---

## Question

Is the destination reached — and is it shipped?

## Scope

- Adapt `tests/e2e/register-submit.spec.ts` selectors to the real pages/locales; make the full suite pass against `wrangler dev`.
- Run unit suites (`bun test`) — all green including new rc-2 dedup tests.
- Mimosa-clean, then ship: commit, PR to main, deploy via established flow (`/ship`), verify live URL end-to-end.
- Re-apply the node_modules OpenNext patch before deploy if any reinstall happened.

## Acceptance

- `npx playwright test` green locally; deployed site: browse → register → submit → profile works on the live URL in both locales.
