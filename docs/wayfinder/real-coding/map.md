---
state: open
labels: [wayfinder:map]
created: 2026-09-06
parent: ../map.md
---

## Destination

A working end-to-end product: a visitor browses the bilingual project feed; a learner registers → logs in → submits a project (screenshot upload to R2, optional repo_url) → shares their public profile link; view counts are deduplicated per the design doc; the written E2E tests pass green against the built pages.

## Notes

- **This map carries execution.** All product decisions are resolved (see the closed map `../map.md` and ticket rc-0). Tickets here are build slices (`task` type) plus one research ticket — work them front-of-frontier first.
- **Approved design doc:** `docs/designs/ai-passport-marketplace.md` — features + constraints source of truth.
- **Keep R2:** no Cloudflare Images, no subscription, no Images token. Delivery via in-app route. See `../../HANDOFF-T1-CLOUDFLARE-IMAGES.md`.
- **Visual direction:** clean Tailwind minimal (zinc palette already in scaffold). No separate design pass — iterate after first working build.
- **i18n shape:** UI copy in English + Thai via `[locale]` segment. API routes stay unlocalized (English errors); the frontend translates/presents. Tag content itself is user data — never translated.
- **Skills to consult per ticket:** `/implement` for build slices; frontend skills for pages; `superpowers:test-driven-development` where tests lead.
- **Gotchas:** Mimosa hook blocks password-like literals in test files (use `auth-test-fixtures.ts` pattern); node_modules OpenNext patch (commit a1eeb47) must be re-applied after reinstall.

## Decisions so far

- [Charting decisions 2026-09-06](tickets/rc-0-charting-decisions.md) — upload folds into the Next.js app; repo_url added now; UI is bilingual (EN/TH i18n); view-count dedup built now (per design doc).
- [Keep R2 (2026-09-06, prior session)](../../HANDOFF-T1-CLOUDFLARE-IMAGES.md) — no Cloudflare Images; screenshots stay in R2 via `UPLOADS` binding; T1 closed obsolete.
- [i18n approach on OpenNext/Cloudflare](tickets/rc-1-i18n-approach-research.md) — **next-intl v4.14.x** with Next 16 `proxy.ts` + `[locale]` + `localePrefix: 'always'` (works on adapter 1.20.3+; edge `middleware.ts` is the fallback); `/api/*` stays unlocalized via matcher exclusion — see `research/rc1-i18n-approach.md`.
- [Schema: repo_url + view dedup](tickets/rc-2-schema-additions.md) — migration 0002 (concurrent agent) + 0003 profile-view counter (gap fix); wrangler `migrations_dir` wired; 78/78 tests green. Debt: drizzle journal out of sync with hand-written migrations.

## Concurrent sessions note

An AutoClaw agent is building in this repo in parallel (it delivered migration 0002, the upload/delivery routes, the i18n skeleton, and page scaffolding). Map claims are advisory for it — **verify the repo state before editing any file** (`git status` + re-read). This session verified and closed rc-2; rc-3/rc-4 files exist but their tickets stay open until verified against their acceptance criteria.

## Not yet specified

*(none — everything in scope is ticketed below)*

## Out of scope

- **Profile editing UI (bio, avatar upload)** — post-MVP; schema fields exist, no pages. Avatar falls back to initials (per WF-003).
- Comments/reactions, full-text search, transactional email, password reset, credential badge — carried over from the closed map `../map.md`.

---

## Tickets

| ID | Title | Type | State | Blocked by |
|----|-------|------|-------|------------|
| [rc-0](tickets/rc-0-charting-decisions.md) | Charting decisions 2026-09-06 | grilling | CLOSED | — |
| [rc-1](tickets/rc-1-i18n-approach-research.md) | i18n approach on OpenNext/Cloudflare | research | CLOSED | — |
| [rc-2](tickets/rc-2-schema-additions.md) | Schema: repo_url + view dedup tables | task | CLOSED | — |
| [rc-3](tickets/rc-3-upload-and-delivery.md) | In-app upload + R2 delivery routes | task | OPEN | — |
| [rc-4](tickets/rc-4-app-shell-i18n.md) | App shell + i18n skeleton | task | OPEN | rc-1 |
| [rc-5](tickets/rc-5-auth-pages.md) | Register + login pages | task | OPEN | rc-4 |
| [rc-6](tickets/rc-6-feed-detail-profile.md) | Feed, project detail, profile pages | task | OPEN | rc-2, rc-4 |
| [rc-7](tickets/rc-7-submission-page.md) | Project submission page + upload wiring | task | OPEN | rc-3, rc-4 |
| [rc-8](tickets/rc-8-e2e-and-ship.md) | E2E green + ship | task | OPEN | rc-5, rc-6, rc-7 |

### Blocking graph

```
rc-1 ──► rc-4 ──► rc-5 ─────┐
                 ──► rc-6 ──┤
rc-2 ──► rc-6, rc-7 ────────┤
rc-3 ──► rc-7 ──────────────┤
                            ▼
                           rc-8 (E2E green + ship)

FRONTIER (open, unblocked): rc-3, rc-4 (rc-5 unblocked once rc-4 verified/closed)
```
