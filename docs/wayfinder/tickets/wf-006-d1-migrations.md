---
parent: docs/wayfinder/map.md
labels: [wayfinder:map, wayfinder:grilling]
created: 2026-09-05
assignee: zcode
state: closed
resolution: Drizzle migrations. drizzle-kit generates migration files from schema. wrangler migrations apply runs them via CI. Type-safe, reversible, standard Cloudflare pattern.
---

## Question

**How are D1 schema changes applied to production?**

The eng review designed the D1 schema (`users`, `projects`, `project_tags`, `project_views`, `profile_views`) but there is no migration strategy. D1 supports migrations via:
- **Drizzle migrations** — `drizzle-kit generate` produces migration files, `wrangler migrations apply` runs them. Type-safe, version-controlled, recommended by Cloudflare.
- **Manual SQL** — write SQL files manually, apply with `wrangler d1 execute`. Simpler to understand, harder to keep in sync.
- **No migrations** — rebuild the DB from scratch on each change. Only works for fresh projects.

The current schema is stable (we're designing it, not changing it in production yet). But once the app is live, schema changes will happen. A migration strategy decided now prevents a future crisis.

Options:
- **Drizzle migrations (recommended)** — generate migration files from schema, apply via CI. Type-safe, reversible, standard Cloudflare pattern.
- **Manual SQL migration files** — version-controlled SQL files, run manually or via script. Lighter toolchain.
- **No migration tooling** — accept that schema changes require manual intervention or DB rebuilds. Works for a solo dev with one DB.

**Which migration strategy for a solo-builder Cloudflare D1 project?**
