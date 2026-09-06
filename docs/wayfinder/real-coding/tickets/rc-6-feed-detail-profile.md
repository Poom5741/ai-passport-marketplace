---
parent: ../map.md
labels: [task]
task_id: rc-6
created: 2026-09-06
state: open
---

## Question

What do the browse + read pages look like?

## Scope

- `/[locale]/` (landing = project feed): cards (screenshot, title, builder, tags, views), tag filter chips, sort newest/most-viewed, pagination — against existing `GET /api/projects`.
- `/[locale]/projects/[id]`: full screenshot, description, tags, live_url + repo_url buttons, builder link, view count (increments via API dedup).
- `/[locale]/users/[id]`: profile header (avatar or initials fallback, bio, joined), their projects grid, profile view count.
- Empty states + loading skeletons; images via the R2 delivery route (rc-3).

## Acceptance

- Feed filters by tag and sorts both ways against real local D1 data.
- Project/profile views increment once per IP+UA per hour (verified in dev).
