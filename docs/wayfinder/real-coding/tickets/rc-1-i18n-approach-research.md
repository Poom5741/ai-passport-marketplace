---
parent: ../map.md
labels: [research]
task_id: rc-1
created: 2026-09-06
state: closed
assignee: research-subagent
---

## Question

Which i18n approach should the bilingual (EN/TH) pages build on, given this app runs Next.js App Router on `@opennextjs/cloudflare` (Workers runtime, not Vercel)?

Sub-questions:
- `[locale]` path segment (`/en/feed`, `/th/feed`) vs cookie/header negotiation without path prefix?
- next-intl vs alternatives (paraglide, custom dictionary + middleware) — what actually works under OpenNext's Worker runtime, including middleware and `generateStaticParams` constraints?
- How do locale-prefixed pages coexist with unlocalized `/api/*` routes?
- Minimal skeleton: middleware, message files, `generateMetadata`, locale switcher.

## Resolution

**Use next-intl (v4.14.x) with Next 16 conventions: `proxy.ts` + `[locale]` segment + `localePrefix: 'always'`.** Full findings in [`research/rc1-i18n-approach.md`](../research/rc1-i18n-approach.md).

- Repo is Next 16.3.4 + `@opennextjs/cloudflare` 1.20.6 — exactly the pairing the adapter currently tests against; adapter 1.20.3+ supports Next 16 `proxy.ts` (Node middleware) experimentally, requiring `nodejs_compat` (already enabled). Edge-style `middleware.ts` (deprecated in Next 16) is the drop-in fallback if the experimental path misbehaves.
- next-intl v4.13.3+ prepared Next 16.3 compatibility; the new `next/root-params` pattern (via `src/i18n/request.ts`) replaces `setRequestLocale` and enables static rendering of `/en/*` and `/th/*` pages (served from the R2 incremental cache on OpenNext).
- `/api/*` stays unlocalized three ways: route handlers stay outside `[locale]`, next-intl's default proxy matcher excludes `/api`, and API responses remain English (frontend localizes presentation).
- Paraglide v2 is runtime-solid (compile-time, AsyncLocalStorage under `nodejs_compat`) but its Next.js/Next-16 story is thin; roll-your-own is the documented last-resort fallback (next-intl's no-middleware mode is essentially it).
- Skeleton (proxy.ts, i18n/{routing,request,navigation}.ts, `[locale]/layout.tsx` as root layout, message files, switcher) and Workers-specific pitfalls are in the research doc — ready to drive rc-4.
