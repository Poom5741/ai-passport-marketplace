# Decisions — AI Passport Marketplace

## Keep R2 for uploads, no Cloudflare Images · 2026-09-06
Decision:     Screenshots stored in R2 via UPLOADS binding; delivery via in-app /api/files/{key} route
Why:          Simplifies architecture — no separate Images token, no subscription needed
Alternatives: Cloudflare Images (requires account-level token + subscription)
Status:       accepted

## View count dedup design · 2026-09-06
Decision:     Dedup via project_views/profile_views tables with (viewer_ip, viewer_ua_hash, viewed_at)
Why:          Design doc specifies IP+UA dedup with 1h window; 24h cleanup
Alternatives: KV-based dedup (simpler but no historical data)
Status:       accepted

## Upload route in-app, not standalone Worker · 2026-09-06
Decision:     POST /api/upload and GET /api/files/[key] are Next.js API routes, not separate Workers
Why:          Simplifies deployment, no separate wrangler config needed
Alternatives: Standalone upload Worker (old workers/upload/index.ts pattern)
Status:       accepted
