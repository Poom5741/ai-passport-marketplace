---
state: closed
labels: [wayfinder:map]
created: 2026-09-05
closed: 2026-09-05
---

## Destination

A deployed AI Passport Marketplace — a community hub where Thai AI Passport learners register, post their projects, and share public builder profiles. Tech: Next.js on Cloudflare Pages, D1 database, R2 + Cloudflare Images storage, JWT auth (KV-based rate limiting). 9 implementation tasks in the eng review plan are now unblocked and ready to execute.

## Notes

- **Domain:** Greenfield web app on Cloudflare edge platform
- **Design doc:** `docs/designs/ai-passport-marketplace.md` (APPROVED)
- **Eng review plan:** `docs/eng-review-plan.md` (CLEAR)
- **Skills to consult before each ticket:** `/office-hours` for product questions, `/plan-eng-review` for architecture
- **Standing preferences:** No premature optimization; defer complexity until the decision forces it; simplicity wins for a learner showcase

## Decisions so far

<!-- one line per closed ticket: gist + link -->

- [CLAUDE.md vs. design doc product mismatch](tickets/wf-002-claude-md-mismatch.md) — **RESOLVED**: AI Passport Marketplace = project showcase hub. CLAUDE.md already updated to match design doc vision.
- [Who can register](tickets/wf-001-who-can-register.md) — **RESOLVED**: AI Passport learners only. @ai-passport.go.th email domain restriction. Learners with personal emails excluded (known tradeoff). Credential badge deferred post-MVP.
- [Avatar upload architecture](tickets/wf-003-avatar-upload.md) — **RESOLVED**: R2 presigned PUT URL works (outside voice was wrong). Avatar upload uses same Worker-signed-URL pattern as screenshots. Falls back to initials avatar if not set.
- [D1 migration strategy](tickets/wf-006-d1-migrations.md) — **RESOLVED**: Drizzle migrations. `drizzle-kit` generates migration files from schema. `wrangler migrations apply` runs them via CI. Type-safe, reversible, standard Cloudflare pattern.
- [Rate limiting strategy](tickets/wf-004-rate-limiting.md) — **RESOLVED**: KV-based in-Worker. Sliding window counter in KV. 5 attempts per IP per 15-minute window on /login and /register.
- [Moderation and content policy](tickets/wf-005-moderation.md) — **RESOLVED**: ToS + user flagging. Simple ToS at signup. "Report" flag on projects. Admin reviews manually. No paid scanning add-ons.
- [CI/CD environment strategy](tickets/wf-007-cicd-environments.md) — **RESOLVED**: Production only. One Cloudflare Pages project, one D1 database. GitHub Actions deploys on merge. Rollback = re-deploy previous commit.

## Not yet specified

<!-- fog: in-scope but not yet sharp enough to ticket -->

- **Credential badge integration** — how does AI Passport verification work? API? Manual? Deferred post-MVP.
- **Email infrastructure** — SMTP for password reset or transactional email. Not needed for MVP launch.
- **Full-text search** — D1 FTS5 available when needed.

## Out of scope

<!-- ruled-out work: never graduates, stays here -->

- Comments and reactions on projects — deferred post-MVP
- Full-text search — deferred (D1 FTS5 available when needed)
- Analytics dashboard for builders — deferred
- Password reset — explicitly out of scope per design doc
- AI Passport credential badge verification — deferred; depends on who-can-register decision

---

## Tickets

<!-- child issues — see tickets/ directory -->

| ID | Title | Type | State | Blocking |
|----|-------|------|-------|----------|
| [WF-001](tickets/wf-001-who-can-register.md) | Who can register? | grilling | CLOSED | — |
| [WF-002](tickets/wf-002-claude-md-mismatch.md) | CLAUDE.md product description mismatch | grilling | CLOSED | — |
| [WF-003](tickets/wf-003-avatar-upload.md) | Avatar upload architecture review | research | CLOSED | — |
| [WF-004](tickets/wf-004-rate-limiting.md) | Rate limiting strategy | grilling | CLOSED | — |
| [WF-005](tickets/wf-005-moderation.md) | Moderation and content policy | grilling | CLOSED | — |
| [WF-006](tickets/wf-006-d1-migrations.md) | D1 migration strategy | grilling | CLOSED | — |
| [WF-007](tickets/wf-007-cicd-environments.md) | CI/CD environment strategy | grilling | CLOSED | — |

### Blocking graph

```
WF-001 ──► WF-004, WF-005, WF-007
WF-002 ──► all decisions
WF-003 ──► independent
WF-004 ──► all closed
WF-005 ──► all closed
WF-006 ──► all closed
WF-007 ──► all closed

ALL DECISIONS RESOLVED — implementation tasks T1-T9 unblocked
```
