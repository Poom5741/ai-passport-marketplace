# TODOS

## Cloudflare Images (T1) — CLOSED
- [x] T1: ~~Cloudflare Images setup~~ — **Closed 2026-09-06**: decision is to KEEP R2 (no Images subscription, no API token). See `HANDOFF-T1-CLOUDFLARE-IMAGES.md`

## Database (T2)
- [x] T2: project_tags DDL — **Done** in scaffold: `drizzle/migrations/0001_initial.sql` + `schema.ts`

## Auth (T3)
- [x] T3: bcrypt cost 10 — **Done** in scaffold: `lib/auth.ts` already uses cost 10

## Upload (T4) — NEXT, UNBLOCKED
- [ ] T4: Worker proxy upload — **Unblocked** (R2 path): add `/api/files/[key]` R2 delivery route, wire `screenshotUrl = /api/files/{key}`, harden Worker (image/* only, streaming)

## Analytics (T5)
- [x] T5: waitUntil view counts — **Done** in `src/app/api/projects/[id]/route.ts` + `src/app/api/users/[id]/route.ts`

## Testing (T6-T9)
- [x] T6: Auth unit tests — **Done** in `src/app/api/auth/auth.test.ts`
- [x] T7: Project submission tests — **Done** in `src/app/api/projects/route.test.ts`
- [x] T8: E2E tests — **Done** in `tests/e2e/register-submit.spec.ts` (needs `/register` + `/projects/new` pages to run)
- [x] T9: Tag normalization tests — **Done** in `src/lib/tags.test.ts`

## Completed
- T1 ✅ closed (keep R2) — no Cloudflare Images
- T2 ✅ (scaffold) — project_tags table + index in migration 0001
- T3 ✅ (scaffold) — bcrypt cost 10 in lib/auth.ts
- T5 ✅ — waitUntil in projects/[id] and users/[id] routes
- T6 ✅ — auth.test.ts: module tests + route handler tests (register + login)
- T7 ✅ — route.test.ts: project submission validation + success
- T8 ✅ — tests/e2e/register-submit.spec.ts: registration + project flow + view counting
- T9 ✅ (scaffold) — tags.test.ts: all normalization cases covered

## Next up
1. T4 (R2 path) — see `docs/implementation/tickets/t4-worker-proxy-upload.md`
2. Frontend pages (`/register`, `/projects/new`, profile) — required before T8 E2E can run
