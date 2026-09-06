---
parent: ../map.md
labels: [task]
task_id: rc-2
created: 2026-09-06
state: closed
assignee: zcode-session
---

## Question

What schema + API changes add `repo_url` and design-doc-faithful view dedup?

## Resolution (2026-09-06)

Implemented jointly by a concurrent agent (AutoClaw) and this session's verification pass:

- **Migration 0002** (concurrent agent): `repo_url` column + `project_views`/`profile_views` dedup tables with `(target, ip, ua_hash, viewed_at)` indexes. Verified applied locally.
- **API**: `POST /api/projects` accepts optional `repoUrl`; view routes do dedup (IP + sha256 UA, 1h window) inside `waitUntil` with 24h opportunistic cleanup. **Gap found and fixed by this session:** profile views were logged but never counted — added `0003_profile_view_count.sql` (`users.profile_view_count`), incremented on new unique profile view, returned in the profile API response.
- **Config fix**: `wrangler.jsonc` d1 block now sets `migrations_dir: drizzle/migrations` — `wrangler d1 migrations apply` works (previously pointed at nonexistent `./migrations`).
- **Tests**: `auth.test.ts` rebuilt with top-level hoisted mocks (vitest 5 rejects nested vi.mock); route DB mocks fixed for drizzle's `select().from().where().get()` chain. Suite: **78/78 green**.

**Known debt:** migrations 0002/0003 are hand-written and absent from `drizzle/meta/_journal.json`, so `drizzle-kit generate` would mis-diff against 0001. Regenerate the drizzle baseline before the next schema change.

## Scope

1. **Migration** (`drizzle-kit generate`): 
   - `ALTER TABLE projects ADD COLUMN repo_url TEXT` (nullable, after `live_url`)
   - `CREATE TABLE project_views (id TEXT PK, project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE, viewer_ip TEXT NOT NULL, viewer_ua_hash TEXT NOT NULL, viewed_at INTEGER NOT NULL)` + index on `(project_id, viewer_ip, viewer_ua_hash, viewed_at)`
   - Same for `profile_views` with `profile_user_id`.
2. **Drizzle schema** updated to match.
3. **API:** `POST /api/projects` accepts optional `repoUrl` (validate URL format when present); project GET/list responses include it.
4. **Dedup:** in `projects/[id]` and `users/[id]` GET routes, inside the existing `waitUntil`: compute `viewer_ip` (cf-connecting-ip) + sha256 of User-Agent; skip increment if a row exists for that viewer+target within the last hour, else insert row + increment. Clean rows older than 24h opportunistically.

## Acceptance

- `wrangler migrations apply` (local D1) succeeds; existing tests still pass.
- Repeat GET with same IP/UA within 1h increments once; different UA increments again.
- Unit test for the dedup check with mocked D1.
