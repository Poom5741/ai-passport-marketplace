---
parent: ../map.md
labels: [task]
task_id: rc-7
created: 2026-09-06
state: open
---

## Question

What does the project submission flow look like?

## Scope

- `/[locale]/projects/new` (auth-gated): title (100 chars), description (2000), screenshot upload (optional per implemented API; client previews, posts to `/api/upload` from rc-3), tags input (normalize client-side display, max 10), live URL (required per design doc — note: current API treats it optional; align), repo URL (optional, from rc-2).
- Submit → `POST /api/projects` → redirect to the new project page.
- Translated validation errors mirror the API's.

## Acceptance

- End-to-end in dev: register → new project with screenshot + tags → appears in feed and on profile.
- Over-limit fields and bad URLs show translated errors; 11 tags rejected.
