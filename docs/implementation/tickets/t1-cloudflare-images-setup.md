---
parent: docs/eng-review-plan.md
labels: [implementation, task]
task_id: T1
created: 2026-09-05
state: closed
estimate_human: ~1h
estimate_cc: ~10min
surfaced_by: A1 (Cloudflare Images decision)
---

## What

Configure Cloudflare Images product in Cloudflare dashboard. Update the upload Worker to use `Images.images.create()` instead of R2 put directly.

## Why

`sharp` doesn't fit in the Workers 1MB bundle limit. Cloudflare Images handles resize-on-delivery: 400px thumbnail + 1200px full served via CDN. Cost ~$5-10/month.

## Files

- `workers/upload/index.ts`
- `.env` (Cloudflare Images env vars)

## How

1. Enable Cloudflare Images in Cloudflare dashboard
2. Add `CLOUDFLARE_IMAGES_ACCOUNT_ID` and `CLOUDFLARE_IMAGES_API_TOKEN` to `.env`
3. Update upload Worker to call `Images.images.create()` instead of R2 put
4. Store returned Cloudflare Images URL (not R2 URL) in D1

## Verify

Upload a test image, check 400px and 1200px variants appear in Cloudflare Images dashboard.

## Dependencies

- None (greenfield)

## CLOSED 2026-09-06 — decision: keep R2

Poom decided NOT to adopt Cloudflare Images (Hosted Images requires a paid
subscription; see `HANDOFF-T1-CLOUDFLARE-IMAGES.md`). Images stay in R2 via the
existing `UPLOADS` binding. Delivery is handled by an app route
(`/api/files/[key]`) instead of `imagedelivery.net`. T4 is now unblocked and
stores R2 URLs in D1. This ticket is intentionally obsolete — do not implement.
