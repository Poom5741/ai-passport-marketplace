# Eng Review: AI Passport Marketplace

Design doc: `docs/designs/ai-passport-marketplace.md`
Status: APPROVED (from /office-hours)
Review phase: Plan review (greenfield — no code yet)

---

## Design Summary

Full platform on Cloudflare — Next.js, D1, R2, JWT auth. Builder registration, profiles, project submission with screenshot upload, public feed, view counts. 2-4 weeks for one builder.

---

## Step 0: Scope Challenge

- **Greenfield** — all 9 Next Steps are new work
- **Complexity:** 9 steps, 0 existing files — not over-built
- **Distribution:** Cloudflare Pages + GitHub Actions — covered
- **No TODOS.md** — none exists yet
- **Key risks identified going in:**
  1. Image resizing in Workers runtime (1MB bundle limit)
  2. Tag filtering with D1 (text column + LIKE vs proper indexing)
  3. JWT without refresh tokens (7-day expiry, re-auth on death)
  4. bcrypt cost 12 in Workers CPU limits

Scope accepted as-is. Proceeding to review sections.

---

## Section 1: Architecture Review

### A1 — Image resizing: Cloudflare Workers bundle limit

**Issue:** `sharp` doesn't fit in the Workers 1MB bundle limit.

**Decision: Cloudflare Images** — Upload directly to Cloudflare Images. Resize on Cloudflare's edge, serves via CDN. Cost ~$5-10/month.

### A2 — Tag storage with D1

**Issue:** `LIKE '%python%'` on a text column does a full table scan — can't use a B-tree index.

**Decision: Separate `project_tags` table** — (project_id, tag) rows, indexed on `tag`. Proper relational design, indexed lookups.

### A3 — JWT without refresh tokens

**Decision: Keep stateless JWT, 7-day, no refresh** — Simplicity and security outweigh re-auth friction for a learner showcase.

### A4 — bcrypt cost in Workers CPU limits

**Decision: Reduce bcrypt cost to 10** — OWASP minimum, significantly faster, still secure for a learner showcase.

---

## Section 4: Performance Review

### P1 — Tag query N+1 on project feed

**Issue:** Listing projects with tags requires joining `projects` + `project_tags` + `tags`. Naive approach = one query per project.

**Fix:** Single query: `SELECT p.*, GROUP_CONCAT(pt.tag) FROM projects p LEFT JOIN project_tags pt ON p.id = pt.project_id GROUP BY p.id`. One round-trip regardless of project count.

### P2 — View count write blocking the response

**Issue:** D1 write on every page view — blocks the user's response.

**Fix:** `waitUntil` in Workers response — increment fires after response is sent, user never waits.

### P3 — D1 cold start latency

**Verdict:** Accept for MVP. Keep-alive cron not needed until scale warrants it.

### P4 — Large uploads through Worker

**Issue:** R2 does not support direct browser presigned URL upload (unlike S3). Browser cannot `PUT` directly to R2 via a presigned URL.

**Fix:** Worker handles upload as proxy — Worker receives the file, streams to R2. Use streaming to keep memory low. This is how R2 actually works.

**Verdict:** Required. Worker proxy upload with streaming. T4 updated accordingly.

---

## Outside Voice (Claude subagent)

**Critical issue 1 — R2 signed URL architecture is broken**

R2's API is not S3-compatible for direct browser uploads. You cannot get a presigned URL from a Worker and have a browser `PUT` directly to R2. The upload will require a Worker endpoint anyway — the "direct upload" efficiency argument doesn't hold for R2.

**Critical issue 2 — JWT without revocation: 7-day breach window**

Stateless JWT with no refresh, no rotation, no blocklist. If any token is stolen (XSS, network interception), the attacker has 7 days of access. No server-side way to invalidate.

**Issue 3 — View count fire-and-forget loses counts**

`waitUntil` can be interrupted mid-write. Traffic spikes = systematic undercount. Accept approximation for "most viewed" sort, or accept the latency of write-then-respond.

---

## Cross-Model Tensions

| Topic | Eng Review says | Outside Voice says | Resolution |
|-------|----------------|-------------------|------------|
| JWT refresh | Keep stateless, 7-day, no refresh — simplicity wins | Unacceptable — 7-day breach window with no revocation | **Kept stateless** — acceptable for learner showcase |
| R2 signed URL | Browser → R2 direct, Worker generates signed URL | R2 doesn't support this — Worker must proxy uploads | **Worker proxy confirmed** — R2 requires Worker endpoint |

---

## NOT in scope

- Comments and reactions on projects — deferred post-MVP
- Full-text search — deferred post-MVP (D1 has FTS5 extension, enable when needed)
- AI Passport credential badge verification — deferred post-MVP (Open question in design doc)
- Email verification on registration — any-email allowed for MVP
- Profile avatar custom upload beyond initials fallback — deferred (avatar_url field exists, avatar upload is step 4)
- Password reset / forgot password — not in design doc
- Moderation / content flagging — not in design doc
- Analytics dashboard for builders — not in design doc

---

## What already exists

- **Nothing** — greenfield project, no existing code

---

## Failure Modes

| Codepath | Failure mode | Test covers it? | Error handling? | User sees |
|---|---|---|---|---|
| Screenshot upload | R2 bucket not configured | No | Returns 500 with message | "Upload failed" |
| Screenshot upload | File > 5MB | Yes (413) | Returns 413 | "File too large" |
| JWT verify | Expired token | No | Returns null, not throw | Redirect to /login |
| Tag filter | Empty result set | No | Returns [] | Empty feed message |
| Project create | D1 write fails | No | Returns 500 | "Something went wrong" |
| View count | D1 write fails | No | Silent fail (fire-and-forget) | No user-visible error |
| Registration | Email taken | Yes (409) | Returns 409 | "Email already registered" |
| Login | Wrong password | Yes (401) | Returns 401 | "Invalid credentials" |

**Critical gaps (no test, no handling):**
- R2 bucket misconfiguration (500, no handling)
- D1 write failure on project create (500, generic message)
- View count D1 write silently fails (acceptable — view counts are non-critical)

---

## Worktree Parallelization

Sequential implementation — no parallelization opportunity. All steps build on Cloudflare project scaffolding and D1 schema. Order matters: project setup → auth → schema → features.

---

## Implementation Tasks

Tickets are now in `docs/implementation/tickets/`.

- [T1](docs/implementation/tickets/t1-cloudflare-images-setup.md) — Cloudflare Images setup (~1h)
- [T2](docs/implementation/tickets/t2-project-tags-table.md) — project_tags DDL (~30min)
- [T3](docs/implementation/tickets/t3-bcrypt-cost-10.md) — bcrypt cost 10 (~1h)
- [T4](docs/implementation/tickets/t4-worker-proxy-upload.md) — Worker proxy upload (~2h)
- [T5](docs/implementation/tickets/t5-waituntil-view-counts.md) — waitUntil view counts (~1h)
- [T6](docs/implementation/tickets/t6-auth-unit-tests.md) — Auth unit tests (~3h)
- [T7](docs/implementation/tickets/t7-project-submission-tests.md) — Project submission tests (~2h)
- [T8](docs/implementation/tickets/t8-e2e-tests.md) — E2E tests (~2h)
- [T9](docs/implementation/tickets/t9-tag-normalization-tests.md) — Tag normalization tests (~2h)

---

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | — |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — | — |
| Eng Review | `/plan-eng-review` | Architecture & tests | 1 | issues_open | 4 decisions, 3 tasks flagged |
| Design Review | `/plan-design-review` | UI/UX gaps | 0 | — | — |
| DX Review | `/plan-devex-review` | Developer experience | 0 | — | — |

**CODEX:** N/A — greenfield plan, outside voice deferred to implementation phase
**CROSS-MODEL:** N/A

**VERDICT:** ENG REVIEW REQUIRES FOLLOW-UP — 4 architecture decisions made (A1-A4), 3 high-priority implementation tasks (T1-T9). Design doc must be updated with decisions before implementation begins.

**UNRESOLVED DECISIONS:**
- A1: Cloudflare Images confirmed — update design doc Next Step 9 accordingly
- A2: project_tags table confirmed — update design doc schema
- A3: JWT stateless confirmed — no design doc change needed
- A4: bcrypt cost 10 confirmed — update design doc
- P4: Signed URL upload — update Next Step 9 implementation approach


**Greenfield — no code. Below is the test coverage plan for when implementation begins.**

### Test Framework
- **Unit tests:** Vitest (bundled with Next.js, fast, good DX)
- **E2E:** Playwright (runs in CI, good Cloudflare Pages support)
- **Coverage target:** All new modules ≥80% branch coverage

### Coverage Diagram

```
CODE PATHS                                            USER FLOWS
[+] app/api/auth/register/route.ts
  ├── POST handler
  │   ├── [GAP]         Missing email validation — should return 400
  │   ├── [GAP]         Email already exists — should return 409
  │   ├── [GAP]         Password too short — should return 400
  │   └── [GAP]         Success — returns 201, no body (stateless JWT)
  └── [GAP]             Non-POST method — should return 405

[+] app/api/auth/login/route.ts
  ├── [GAP]             Wrong password — returns 401
  ├── [GAP]             User not found — returns 401
  ├── [GAP]             Success — sets HttpOnly JWT cookie
  └── [GAP]             Rate limiting — returns 429

[+] app/api/projects/route.ts (create)
  ├── [GAP]             Unauthenticated — returns 401
  ├── [GAP]             Screenshot too large — returns 413
  ├── [GAP]             Invalid URL format — returns 400
  ├── [GAP]             Title too long — returns 400
  ├── [GAP]             Tag count > 10 — returns 400
  └── [GAP]             Success — returns 201 with project

[+] app/api/projects/route.ts (list)
  ├── [GAP]             Filter by tag — verifies correct SQL index
  ├── [GAP]             Sort by newest — verifies ORDER BY
  ├── [GAP]             Sort by most viewed — verifies view_count
  └── [GAP]             Pagination — verifies LIMIT/OFFSET

[+] lib/auth.ts (JWT verify)
  ├── [GAP]             Expired token — returns null, not throw
  ├── [GAP]             Malformed token — returns null
  └── [GAP]             Valid token — returns user_id

[+] lib/d1.ts (database helpers)
  ├── [GAP]             Parameterized query — no SQL injection possible
  └── [GAP]             project_tags insert — batch insert all tags

USER FLOWS
[+] Registration flow
  ├── [GAP] [→E2E] Register → redirect to profile → see empty state
  └── [GAP] [→E2E] Register with dup email → error message

[+] Project submission
  ├── [GAP] [→E2E] Submit with all fields → appears in feed
  ├── [GAP] [→E2E] Submit without screenshot → error before upload
  ├── [GAP] [→E2E] Submit with 11 tags → error, max 10
  └── [GAP] [→E2E] Submit with no live URL → still saves (optional field)

[+] View counting
  ├── [GAP]             Same IP+UA within 1 hour = no new increment
  ├── [GAP]             Different IP = new increment
  └── [GAP]             Unauthenticated view still counts

COVERAGE: 0/18 paths tested (0%)  |  Code paths: 0/13 (0%)  |  User flows: 0/7 (0%)
QUALITY: No tests yet — all GAPS
```

### Missing Tests (all GAPs above)
All GAP items need unit tests or E2E tests. Priority order:
1. Auth flows (register, login, JWT verify) — security-critical
2. Project submission validation — data integrity
3. Tag normalization (lowercase, dedupe) — data quality
4. View count deduplication logic — business logic
5. Feed filtering and pagination — core UX
6. Error handling (400, 401, 405, 409, 413, 429, 500) — robustness

---
