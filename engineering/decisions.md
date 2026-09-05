---
name: ai-passport-marketplace-decisions
description: Architectural decisions for AI Passport Marketplace
created: 2026-09-05
---

## WF-001 · 2026-09-05 — Learner-only registration

Decision: Only `@ai-passport.go.th` email domain can register.
Why:     AI Passport is a closed cohort — the product is specifically for its graduates.
Status:  accepted

## WF-002 · 2026-09-05 — Product = project showcase hub

Decision: The product is a public project showcase / portfolio hub, not a marketplace.
Why:     Learners need a place to display work; discovery is the core value, not transactions.
Status:  accepted

## WF-003 · 2026-09-05 — Cloudflare Images for avatar/upload

Decision: Upload to Cloudflare Images (not R2 directly). Resize on edge, serve via CDN.
Why:     `sharp` doesn't fit Workers 1MB bundle. Cloudflare Images handles resize-on-delivery.
         Cost ~$5-10/month. 400px thumbnail + 1200px full variant.
Status:  accepted

## WF-004 · 2026-09-05 — KV-based rate limiting

Decision: 5 attempts/IP/15min on /login and /register via KV counter.
Why:     D1 writes are more expensive. KV is purpose-built for this pattern.
Status:  accepted

## WF-005 · 2026-09-05 — ToS + user flagging, no paid moderation

Decision: Terms of Service required. Users can flag content. No paid moderation features.
Why:     Keep MVP scope lean. Moderation is a post-MVP concern.
Status:  accepted

## WF-006 · 2026-09-05 — Drizzle migrations in CI

Decision: `drizzle-kit generate` + `wrangler migrations apply` in GitHub Actions CI.
Why:     Zero-touch deployment. Migrations run automatically on deploy.
Status:  accepted

## WF-007 · 2026-09-05 — Production only, no staging/preview

Decision: No staging or preview environments. All deploys go directly to production.
Why:     Learner showcase with no SLA. Simplicity wins.
Status:  accepted

## A4 · 2026-09-05 — bcrypt cost 10

Decision: bcrypt cost parameter set to 10 (OWASP minimum).
Why:     Cost 12 can exceed Workers 50ms CPU allowance on free tier.
         Cost 10 is still secure for a learner showcase with no high-value targets.
Status:  accepted

## P4 · 2026-09-05 — Worker proxy for R2 uploads

Decision: Worker acts as proxy for all file uploads. Streams to R2 via `ReadableStream`.
Why:     R2 does not support direct browser presigned URL upload (unlike S3).
         Streaming keeps memory under 128MB for files up to 5MB.
Status:  accepted
