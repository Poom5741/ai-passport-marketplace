---
parent: docs/wayfinder/map.md
labels: [wayfinder:map, wayfinder:grilling]
created: 2026-09-05
state: closed
resolution: KV-based in-Worker rate limiting. Sliding window counter stored in KV. 5 attempts per IP per 15-minute window on /login and /register. Simple, free, works across edge nodes.
---

## Question

**How should rate limiting work on the auth endpoints (register, login)?**

The test coverage diagram flagged login rate limiting as a GAP. Without rate limiting:
- Brute force attacks on login are free
- Email enumeration (checking which emails are registered) is free
- A single actor can create many accounts quickly

Cloudflare has built-in rate limiting (via Cloudflare's edge network), but it costs money on the Pro plan. Within the Workers runtime, there are free options:
- KV-based rate limiting (in-memory, distributed across edge nodes)
- Simple IP-based blocking (unreliable due to NAT)
- Cloudflare's native Rate Limiting API (paid feature)

Options:
- **Cloudflare Rate Limiting (paid)** — most reliable, $5/month via Cloudflare. Configured at the edge, no Worker code needed.
- **KV-based in-Worker rate limiting** — free, stores request counts in KV. Slight edge latency, not perfectly distributed.
- **Defer to post-MVP** — no rate limiting for now. Accept the risk for a learner showcase with low traffic.

**What's the right approach for a learner showcase that doesn't want to pay for Cloudflare Pro?**

**Resolution: KV-based in-Worker rate limiting.** Free, stores request counts in KV with sliding window. 5 attempts per IP per 15-minute window on /login and /register. No external service needed.
