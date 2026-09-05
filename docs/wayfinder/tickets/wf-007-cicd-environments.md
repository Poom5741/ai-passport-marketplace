---
parent: docs/wayfinder/map.md
labels: [wayfinder:map, wayfinder:grilling]
created: 2026-09-05
state: closed
resolution: Production only. One Cloudflare Pages project, one D1 database. GitHub Actions deploys on merge. Rollback = re-deploy previous commit via wrangler. Simple, fast, appropriate for solo builder.
---

## Question

**What CI/CD environments should AI Passport Marketplace have?**

The design doc says "CI/CD via GitHub Actions pushing to Cloudflare on merge." That's it. But a real deployment has questions:
- Do you have a staging/preview environment separate from production?
- Do preview deployments get their own D1 database or share with prod?
- How are secrets managed across environments?
- What's the rollback story when a deploy breaks?

Options:
- **Production only** — one Cloudflare Pages project, one D1 database. GitHub Actions deploys on merge. Simple. Rollback = re-deploy previous commit.
- **Production + preview per PR** — Cloudflare Pages supports preview deployments per PR. Each PR gets a unique URL. Each preview could share a test D1 database or have its own.
- **Production + staging** — a separate staging environment that mirrors production. Full parity. Higher complexity for a solo builder.

For a learner showcase being built by one person, the question is really: is the additional complexity of staging/preview worth it, or does production-only with a fast rollback story cover it?

**What CI/CD setup for a solo-builder learner showcase?**

**Resolution: Production only.** One Cloudflare Pages project, one D1 database. GitHub Actions deploys on merge. Rollback = re-deploy previous commit.
