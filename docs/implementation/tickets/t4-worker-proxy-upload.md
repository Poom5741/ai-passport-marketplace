---
parent: docs/eng-review-plan.md
labels: [implementation, task]
task_id: T4
created: 2026-09-05
state: open
estimate_human: ~2h
estimate_cc: ~15min
surfaced_by: P4 (R2 requires Worker proxy — outside voice confirmed)
---

## What

Implement Worker proxy upload with streaming. Worker receives the file, streams to R2. Use `ReadableStream` to keep memory under 128MB.

## Why

R2 does not support direct browser presigned URL upload (unlike S3). Browser cannot `PUT` directly to R2 via a presigned URL. Worker must act as proxy. Streaming keeps memory low for large files (up to 5MB).

## Files

- `workers/upload/index.ts`
- `app/projects/new/page.tsx` (upload form)

## How

1. Worker receives `POST /api/upload` with `multipart/form-data`
2. Extract file from `request.formData()`
3. Stream file body to R2 via `@cloudflare/workers-types` R2 binding
4. Return R2 object key (not full URL) to client
5. On project save, construct Cloudflare Images URL from key

Memory budget: 128MB max. Use streaming — never load full file into memory.

## Verify

Upload a 5MB test file. Worker memory stays under 128MB. Response time < 5s. File appears in R2 bucket.

## Dependencies

- T1 — CLOSED: decision 2026-09-06 is to keep R2 (no Cloudflare Images, no
  subscription, no API token). Updated for the R2 path:
  - Step 4 changes: store the **R2 delivery URL** (`/api/files/{key}` via the
    app's R2 streaming route) in D1 — NOT a Cloudflare Images URL.
  - Variant creation is dropped; if resize-on-delivery is ever needed, revisit
    Image Transformations once the app has a custom domain.
- No dashboard/account setup is required for this ticket anymore.

## Remaining implementation (2026-09-06)

1. `src/app/api/files/[key]/route.ts` — stream objects from the `UPLOADS` R2
   binding with stored `httpMetadata.contentType` (works on `*.workers.dev`,
   no public bucket needed).
2. Wire client upload response `{key}` → `screenshotUrl = /api/files/{key}`
   into `projects.screenshot_url` (and `users.avatar_url` for avatars).
3. Worker hardening: allow only `image/*`, keep the 5MB cap; switch
   `arrayBuffer()` → `ReadableStream` passthrough per the memory budget above.
