---
parent: ../map.md
labels: [wayfinder:map, grilling]
task_id: rc-0
created: 2026-09-06
state: closed
---

## Question

What are the scope-shaping decisions for the "real coding" map?

## Resolution (charting session, 2026-09-06 — answered by Poom)

1. **Upload path: fold into the Next.js app.** `workers/upload/index.ts` is never routed/deployed; the app Worker already holds the `UPLOADS` R2 binding. Implement `POST /api/upload` inside the app; delete the separate worker file. (Supersedes the T4 ticket's separate-Worker framing — see `docs/implementation/tickets/t4-worker-proxy-upload.md`.)
2. **repo_url: add now.** Approved design doc lists it; the itqan review flagged its absence. One migration + API field + form input.
3. **UI language: bilingual (i18n), English + Thai.** Full `[locale]` routing with translated copy. Biggest scope choice — shapes every page, researched in rc-1.
4. **View-count dedup: build now.** Per design doc: `project_views` / `profile_views` tables, same IP+UA hash within 1 hour = no increment.
5. **(Carried from prior session) Keep R2** — no Cloudflare Images. See `HANDOFF-T1-CLOUDFLARE-IMAGES.md`.

Defaults applied without objection: visual = clean Tailwind minimal; profile-editing UI (bio/avatar) deferred post-MVP; API error messages stay English.
