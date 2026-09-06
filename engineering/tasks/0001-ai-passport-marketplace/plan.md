# Plan — AI Passport Marketplace: Full Build

## Dependency Graph
```
rc-1 → rc-4 → rc-5, rc-6
rc-2 → rc-6, rc-7
rc-3 → rc-7
rc-5, rc-6, rc-7 → rc-8
```

## Tasks (in execution order)

### T1: rc-2 — Schema additions (rc-2)
**Goal:** Add repo_url column and view dedup tables
**Acceptance:** Migration valid, schema updated, API accepts repoUrl, view dedup works
**Shape:** Migration SQL + Drizzle schema + API route changes + unit tests

### T2: rc-3 — Upload + delivery routes (rc-3)
**Goal:** POST /api/upload and GET /api/files/[key] in-app routes
**Acceptance:** Upload via curl with auth → retrievable at /api/files/{key}, error codes correct
**Shape:** Two new API routes + tests, workers/ removed

### T3: rc-1 — i18n research (rc-1)
**Goal:** Determine i18n approach for OpenNext/Cloudflare
**Acceptance:** Research document with recommendation and skeleton code
**Shape:** Research markdown document

### T4: rc-4 — App shell + i18n skeleton (rc-4, blocked by rc-1)
**Goal:** [locale] routing, middleware, dictionaries, app shell
**Acceptance:** / redirects to /en, both locales render shell, build works
**Shape:** proxy.ts, dictionaries, layout, locale switcher, auth nav

### T5: rc-5 — Register + login pages (rc-5, blocked by rc-4)
**Goal:** Auth pages wired to existing API
**Acceptance:** Full flow works, errors translated, auth-aware redirect
**Shape:** Two page routes + two form components

### T6: rc-6 — Feed, detail, profile pages (rc-6, blocked by rc-2, rc-4)
**Goal:** Browse + read pages
**Acceptance:** Feed filters/sorts, project detail shows all fields, profile shows user
**Shape:** Three page routes + shared components

### T7: rc-7 — Submission page (rc-7, blocked by rc-2, rc-3, rc-4)
**Goal:** Project submission form with upload wiring
**Acceptance:** End-to-end submit with screenshot + tags
**Shape:** One page route + form component

### T8: rc-8 — E2E + ship (rc-8, blocked by rc-5, rc-6, rc-7)
**Goal:** E2E tests pass, build verified
**Acceptance:** Playwright tests green, build succeeds, preview runs
**Shape:** Updated E2E test selectors
