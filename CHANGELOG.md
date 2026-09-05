# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0.0] - 2026-09-05

### Added

- **Next.js on Cloudflare Pages** — full project scaffold with Wrangler deployment config
- **D1 database schema** — users, projects, project_tags, tags tables with proper indexes
- **JWT authentication** — register and login API routes with bcrypt cost 10, 7-day stateless tokens
- **Project API** — CRUD endpoints for project listing and creation
- **User API** — user profile lookup
- **Tag system** — tag normalization (lowercase, dedupe), tag-based project filtering
- **Worker upload endpoint** — streaming proxy to R2 storage
- **Rate limiting** — per-user rate limiting middleware
- **Test suite** — Vitest with tests for tags normalization, project routes, and auth flows
