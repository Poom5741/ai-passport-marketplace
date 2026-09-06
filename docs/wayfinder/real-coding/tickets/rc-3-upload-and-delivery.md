---
parent: ../map.md
labels: [task]
task_id: rc-3
created: 2026-09-06
state: open
---

## Question

How do screenshots get uploaded and served with zero separate Workers?

## Scope

1. **`POST /api/upload`** (new route in the Next app, replaces `workers/upload/index.ts` — delete that file):
   - Requires session (`getSession`); only `image/png|jpeg|webp`; max 5MB
   - Key: `crypto.randomUUID()` + safe extension; `env.UPLOADS.put(key, stream, { httpMetadata: { contentType } })`
   - Returns `{ key, url: "/api/files/{key}" }` on 201
2. **`GET /api/files/[key]`** delivery route: `env.UPLOADS.get(key)`, stream body with stored `httpMetadata.contentType` (works on `*.workers.dev`, no public bucket).
3. Keep key validation strict (regex) to prevent path/key enumeration abuse.

## Acceptance

- Upload via curl with auth cookie → object retrievable at `/api/files/{key}` with correct Content-Type.
- 401 unauthenticated; 413 oversize; 415 wrong type; 404 unknown key.
- `workers/` directory removed from repo and wrangler config references (if any) cleaned.
