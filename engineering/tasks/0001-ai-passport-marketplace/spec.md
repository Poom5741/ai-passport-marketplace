# Spec — AI Passport Marketplace: Full Build

## Objective
Build a working end-to-end product: a visitor browses the bilingual project feed; a learner registers, logs in, submits a project (screenshot upload to R2, optional repo_url), shares their public profile link; view counts are deduplicated per the design doc; the written E2E tests pass green against the built pages.

## Success Criteria
1. Feed page renders project cards with real data from API
2. Tag filtering and sort (newest/most-viewed) work
3. Project detail shows all fields including repoUrl
4. Profile shows user info and their projects
5. Registration and login flows work end-to-end
6. Project submission with screenshot upload to R2 works
7. View counts deduplicated per IP+UA per hour
8. Bilingual EN/TH via [locale] path segment
9. Unit tests: 78/78 pass
10. E2E tests: 5/5 pass
11. Build succeeds (next build + opennext build)
12. Preview server runs on wrangler

## Scope (in)
- rc-1: i18n research
- rc-2: Schema additions (repo_url, project_views, profile_views)
- rc-3: In-app upload + R2 delivery routes
- rc-4: App shell + i18n skeleton
- rc-5: Register + login pages
- rc-6: Feed, project detail, profile pages
- rc-7: Project submission page + upload wiring
- rc-8: E2E tests + ship verification

## Not-doing
- Profile editing UI (bio, avatar upload) — post-MVP
- Comments/reactions, full-text search, transactional email, password reset, credential badge
- Separate design pass — iterate after first working build
- Deploy to production (requires Cloudflare account access)

## Constraints
- Cloudflare Pages (OpenNext) runtime, not Vercel
- D1 (SQLite), R2, KV bindings
- Tailwind zinc palette, no separate design system
- Mimosa hook blocks password-like literals in source/tests
- Bilingual EN/TH, API routes stay unlocalized
