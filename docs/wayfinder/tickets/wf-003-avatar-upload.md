---
parent: docs/wayfinder/map.md
labels: [wayfinder:map, wayfinder:research]
created: 2026-09-05
assignee: zcode
state: closed
resolution: |
  RESEARCH FINDING: R2 DOES support direct browser upload via presigned PUT URLs. Confirmed via Cloudflare docs — presigned PUT URLs allow users to upload directly to R2 from a browser with proper CORS headers set. The outside voice was incorrect about this.

  AVATAR OPTIONS (ranked):
  1. R2 presigned PUT URL (recommended) — same pattern as screenshot upload. Browser uploads directly, Worker generates signed URL. Small avatar files = fast, low memory.
  2. Gravatar — derive MD5 hash from email, fetch from gravatar.com. No upload needed. Requires users have Gravatar accounts. Not reliable for all users.
  3. UI Avatars — free service, generates initials-based avatars. No upload, no account needed. Ugly but functional.

  RECOMMENDATION: R2 presigned URL for custom avatars. Falls back to initials-based avatar if not set (as the design doc already specifies). This keeps the avatar upload architecture consistent with the screenshot approach.
---

## Question

**Can avatars use the same Worker-proxy-to-R2 upload pattern as screenshots, or does avatar upload face the same R2 presigned URL problem that screenshot upload hit?**

The eng review corrected the screenshot upload from "direct R2 signed URL" to "Worker proxy with streaming" after the outside voice revealed R2 doesn't support browser direct upload. The avatar upload in the design doc was assumed to use "the same pattern" — but this was never verified.

Research to do:
1. Does R2 support direct browser upload via presigned URLs at all? (Outside voice said no for screenshots — does the same apply to avatars?)
2. If not, is the Worker proxy approach sufficient for avatar uploads (typically much smaller than screenshots)?
3. Is there a simpler alternative for avatars (e.g., Gravatar by email hash, or Cloudflare's Delivered URL approach)?

**Deliverable:** A short research note with the recommended avatar upload approach and why. Post as a comment on this ticket, then close.
