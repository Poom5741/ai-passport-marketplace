# RC-1: i18n approach for bilingual (EN/TH) UI on Next.js 16 + @opennextjs/cloudflare

- **Ticket:** [`rc-1-i18n-approach-research.md`](../tickets/rc-1-i18n-approach-research.md)
- **Date:** 2026-09-06
- **Scope:** research only — no code or dependency changes made.
- **Supersedes:** an earlier draft of this file that predated verification of Next 16 / OpenNext 1.20.3+ proxy support.

## 1. Verified repo facts

| Fact | Value |
|---|---|
| Next.js | `16.3.4` (Turbopack default bundler; `proxy.ts` era) |
| React | `19.2.8` / `react-dom 19.2.8` |
| Deploy adapter | `@opennextjs/cloudflare ^1.20.6` (devDep); `wrangler.jsonc` → `main: .open-next/worker.js` |
| Wrangler | `^4.129.0`, `compatibility_date: 2024-09-23`, **`nodejs_compat` enabled**, `global_fetch_strictly_public` |
| Bindings | D1 (`DB`), R2 (`UPLOADS`, `NEXT_INC_CACHE_R2_BUCKET`), KV (`RATE_LIMIT`), Images (`IMAGES`), service binding (`WORKER_SELF_REFERENCE`) |
| Routes | `src/app/` only: `api/` (auth register/login, projects/[id], users/[id]), `layout.tsx`, `page.tsx` |
| Middleware | **none** (`src/middleware.ts` does not exist — greenfield for i18n routing) |
| i18n libs | none installed |
| Legacy cruft | `@cloudflare/next-on-pages` devDep + `pages:deploy` script still in `package.json`, but deployment is OpenNext |

Adapter 1.20.6 is notable: its release notes say it "bumps Next to **16.3.4**" — i.e. the exact Next version this repo pins is the one the adapter currently tests against.

## 2. Recommendation

**Winner: `next-intl` (v4.14.x) with Next.js 16 conventions — `proxy.ts` + `[locale]` segment + `localePrefix: 'always'`.**

Why it wins for *this* app:

1. **Version alignment is unusually good right now.** next-intl v4.13.3 (Jul 2026) shipped "Next.js 16.3 compatibility preparation"; v4.14.2 is current ([releases](https://github.com/amannn/next-intl/releases)). OpenNext's adapter added experimental `proxy.ts` (Node middleware) support in **1.20.3** (Aug 26, 2026) and tests against Next 16.3.4 in 1.20.6 ([releases](https://github.com/opennextjs/opennextjs-cloudflare/releases)). This repo sits exactly in the supported window (Next 16.3.4 + adapter 1.20.6).
2. **Next 16.3's `next/root-params` removes next-intl's historical pain point.** The old `setRequestLocale()` hack for static rendering is deprecated (next-intl v4.13.5, [issue #663](https://github.com/amannn/next-intl/issues/663)); the new pattern makes static rendering of `/en/*` and `/th/*` pages work cleanly — important on OpenNext, where statically rendered pages are served from the R2 incremental cache instead of re-rendered per request ([next-intl blog](https://next-intl.dev/blog/nextjs-root-params)).
3. **Full RSC + App Router integration**: typed localized `<Link>`, `usePathname`/`useRouter` that keep the locale prefix, `getTranslations`/`useTranslations` across server and client components, alternate-link metadata for SEO.
4. **`/api` coexistence is built in**: next-intl's default middleware matcher *excludes* `/api`, and concrete route segments always beat the dynamic `[locale]` segment in Next's route matching (details in §7).
5. **ICU/CLDR formatting via `Intl`** — Thai needs no plural logic, and `Intl.DateTimeFormat('th-TH')` gives Buddhist-calendar dates by default. The Workers runtime supports the Intl API family ([CF web standards docs](https://developers.cloudflare.com/workers/runtime-apis/web-standards/)).
6. **Escape hatches exist** (§6): the same `createMiddleware(routing)` runs in deprecated-but-still-working edge-style `middleware.ts`, and next-intl documents a no-middleware mode (root redirect + `localePrefix: 'always'`) — a degenerate case of the "roll-your-own" option. Falling back costs a file rename plus removing the plugin.

**Runner-up / when to reconsider:** Paraglide JS if bundle size ever becomes critical (compile-time tree-shaking). **Fallback if all else fails:** roll-your-own `[locale]` + JSON dictionaries, which this design degrades to naturally (the no-middleware next-intl mode is essentially that pattern).

## 3. Runtime reality check: middleware under Next 16 + OpenNext/Workers

This is the crux, because next-intl's routing depends on its middleware. Verified state:

- **Next 16 renamed `middleware.ts` → `proxy.ts`.** `proxy.ts` **always runs on the Node.js runtime**. `middleware.ts` still works in Next 16 (edge-runtime use cases) but is **deprecated** and will be removed in a future major ([Next.js 16 blog](https://nextjs.org/blog/next-16)).
- **OpenNext Cloudflare adapter**: feature table lists "Middleware — Supported", with the caveat that Node.js middleware was long unsupported ([Cloudflare OpenNext guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/opennext/), [opennext.js.org/cloudflare](https://opennextjs.org/cloudflare)). **Since adapter 1.20.3 (Aug 26, 2026), Next.js 16 `proxy.ts` / Node.js middleware is supported experimentally, requiring `nodejs_compat`** ([release notes](https://github.com/opennextjs/opennextjs-cloudflare/releases), PR [#1309](https://github.com/opennextjs/opennextjs-cloudflare/pull/1309) merged Jul 13, 2026; the earlier PR [#1280](https://github.com/opennextjs/opennextjs-cloudflare/pull/1280) was rejected as not a real fix). This repo already has `nodejs_compat`.
- **next-intl follows the Next 16 convention**: its docs now use `proxy.ts` ("proxy.ts was called middleware.ts up until Next.js 16") and `createMiddleware(routing)` from `next-intl/middleware` ([next-intl routing/middleware docs](https://next-intl.dev/docs/routing/middleware)).
- **History of next-intl × Cloudflare-adapter breakage**: opennextjs-cloudflare [#683](https://github.com/opennextjs/opennextjs-cloudflare/issues/683) (May 2025) — next-intl middleware failed to *build* under adapter 1.0.4 (`PagesManifest` export error in `@opennextjs/aws`); closed/fixed. next-intl issue [#786](https://github.com/amannn/next-intl/issues/786) concerned `@cloudflare/next-on-pages` (the *Pages* adapter this repo no longer uses). Community reports of middleware header quirks on Workers (`x-middleware-next`) exist ([Medium: Kinde + next-intl with OpenNext](https://marekurbanowicz.medium.com/kinde-next-intl-with-opennext-on-cloudflare-not-that-easy-atm-e837d7af0efa)) but predate the 1.20.x line.
- **The pre-16.3 deadlock is over**: with Next ≤16.2 + older adapters, Node-only `proxy.ts` vs edge-only middleware support was a trap ([workers-sdk #13755](https://github.com/cloudflare/workers-sdk/issues/13755) — `async_hooks` import crash from a generated middleware bundle; that repro was mostly `@cloudflare/next-on-pages`). Both sides have since shipped: Next 16.3 stabilized `next/root-params` for locale params, and OpenNext shipped Node-middleware support.

Bottom line: **next-intl's middleware runs on this stack today**, via `proxy.ts` (experimental adapter path) or `middleware.ts` (fully supported edge path). Neither requires anything this repo lacks.

## 4. Options compared

| Criterion | **next-intl v4.14.x** | Paraglide JS v2 (`@inlang/paraglide-js`) | Roll-your-own (`[locale]` + JSON dicts) |
|---|---|---|---|
| Approach | Runtime dictionaries + ICU via `Intl` | Compile-time message functions, tree-shaken | Hand-rolled dictionaries (any format) |
| RSC support | First-class: `getTranslations` (server) / `useTranslations` (client), `NextIntlClientProvider` | Works; server locale via AsyncLocalStorage (`getLocale()`); docs advise keeping it on Cloudflare Workers with `nodejs_compat` ([SSR docs](https://github.com/opral/paraglide-js/blob/main/docs/server-side-rendering.md)) | DIY context / per-page `params.locale` plumbing |
| Locale routing | Built-in: negotiation, redirects/rewrites, cookie persistence, `localePrefix` modes, typed localized navigation | URL localize/delocalize via router rewrite hooks; Next.js integration is comparatively thin ([paraglidejs.com/next-js](https://paraglidejs.com/next-js) is a short overview; v2's deep integrations are SvelteKit/TanStack/Vite) | You write the negotiation + redirect yourself |
| Next 16 / proxy.ts | Yes — docs use `proxy.ts`; 16.3 `root-params` supported; `setRequestLocale` deprecated | Not Next-16-aware in docs; a middleware doc exists but Next-specific guidance is sparse | Whatever you build (e.g. no middleware at all) |
| OpenNext/Workers fit | Good — edge-safe middleware; known historical build issue fixed (#683); runs on adapter 1.20.3+ | Good — compile-time output is runtime-agnostic; AsyncLocalStorage available under `nodejs_compat` | Best in theory (no dependencies to break), worst in practice (you own everything) |
| Static rendering | `generateStaticParams` for locales; with 16.3 root params no `setRequestLocale` needed; static pages hit R2 cache on OpenNext | Good (messages are build-time constants) | Manual — trivially static if kept simple |
| Bundle/tooling | Small runtime (~14 kB core), one plugin in `next.config.ts`, one `proxy.ts` file | Tiny runtime, but adds a compile step (inlang project + `paraglide compile`) and compiler plugin; call sites are `import * as m from '$lib/paraglide/messages'` | Zero deps, zero tooling |
| Thai (th-TH) | ICU via `Intl` — Buddhist calendar dates by default, `nu-thai` digit option, no plural complexity; polyfill guidance documented ([runtime requirements](https://next-intl.dev/docs/environments/runtime-requirements)) | Same `Intl` story for formatting; simpler message syntax | You wire `Intl` calls yourself |
| SEO niceties | Auto alternate links / hreflang helpers, localized metadata helpers | Manual-ish | Manual |
| Maintenance risk | Single focused maintainer (amannn) but extremely active; releases track Next betas (16.3 compat prepared weeks ahead) | Active (inlang/opral) but Next.js is not the flagship framework of v2 | No external risk; all internal |
| Verdict | **Recommended** | Solid library, weaker Next.js/Next-16 story | Keep as last resort |

Notes on alternatives not pursued:

- **`@cloudflare/next-on-pages`** (still in `package.json`): edge-only adapter, and Next 16's Node-only `proxy.ts` deadlocks it ([workers-sdk #13755](https://github.com/cloudflare/workers-sdk/issues/13755)). It is legacy here — the deploy path is OpenNext; consider deleting the devDep + `pages:deploy` script in a future cleanup ticket.
- **vinext** (Cloudflare's now-recommended adapter for *new* Next apps): not applicable — this is an existing OpenNext app and switching adapters is out of scope.

## 5. Minimal working skeleton

Target layout (+ = new, → = move, ✗ = delete):

```
src/
  proxy.ts                      (+  Next 16 convention; see §6 fallback note)
  i18n/
    routing.ts                  (+)
    request.ts                  (+)
    navigation.ts               (+)
  messages/
    en.json                     (+)
    th.json                     (+)
  app/
    [locale]/                   (+)
      layout.tsx                (+  becomes the ROOT layout — html/body live here)
      page.tsx                  (→  moved from src/app/page.tsx, translated)
      feed/page.tsx             (+)
    api/                        (   UNTOUCHED — stays unlocalized)
    globals.css                 (   stays; imported by [locale]/layout.tsx)
    layout.tsx                  (✗  DELETE — pass-through root layout must go)
```

### 5.1 `next.config.ts` — wire the plugin

```ts
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {};

const withNextIntl = createNextIntlPlugin(); // picks up ./src/i18n/request.ts
export default withNextIntl(nextConfig);
```

### 5.2 `src/i18n/routing.ts` — single source of truth for locales

```ts
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "th"],
  defaultLocale: "en",
  localePrefix: "always" // /en/feed, /th/feed; `/` redirects to negotiated locale
});
```

### 5.3 `src/i18n/request.ts` — Next 16.3 root-params pattern

Replaces `requestLocale` and `setRequestLocale`, both deprecated in next-intl v4.13:

```ts
import * as rootParams from "next/root-params";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async () => {
  const param = await rootParams.locale(); // Next.js 16.3+
  if (!hasLocale(routing.locales, param)) notFound();

  return {
    locale: param,
    messages: (await import(`../../messages/${param}.json`)).default
  };
});
```

### 5.4 `src/i18n/navigation.ts` — localized routing helpers

```ts
import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
```

### 5.5 `src/proxy.ts` — locale negotiation

Next 16 convention (`src/middleware.ts` is the deprecated equivalent):

```ts
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Skip /api (must stay unlocalized), Next internals, and static files.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"]
};
```

### 5.6 `src/app/[locale]/layout.tsx` — becomes the root layout

```tsx
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import "../globals.css";

export const dynamicParams = false; // unknown locales 404 at build-matching time

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const title =
    locale === "th" ? "ตลาด AI Passport" : "AI Passport Marketplace";
  return {
    title,
    alternates: { languages: { en: "/en", th: "/th" } }
  };
}

export default async function LocaleLayout({
  children
}: LayoutProps<"/[locale]">) {
  const locale = await getLocale();

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
```

### 5.7 `src/app/[locale]/page.tsx` — server component example

```tsx
import { getTranslations } from "next-intl/server";

export default async function HomePage() {
  const t = await getTranslations("Home");
  return <h1>{t("title")}</h1>;
}
```

### 5.8 Message files — `src/messages/en.json` and `src/messages/th.json`

Flat namespace per screen; ICU where formatting matters:

```json
{
  "Home": {
    "title": "Discover AI projects",
    "subtitle": "A marketplace of student-built AI passports"
  },
  "Feed": {
    "title": "Project feed",
    "viewCount": "{count, number} views",
    "lastUpdated": "Updated {when, date, long} at {when, time, short}"
  },
  "Nav": {
    "feed": "Feed",
    "submit": "Submit project",
    "login": "Log in"
  },
  "LocaleSwitcher": { "label": "Language" }
}
```

```json
{
  "Home": {
    "title": "ค้นพบโปรเจกต์ AI",
    "subtitle": "ตลาดกลาง AI Passport จากนักเรียนและนักพัฒนา"
  },
  "Feed": {
    "title": "ฟีดโปรเจกต์",
    "viewCount": "เข้าชม {count, number} ครั้ง",
    "lastUpdated": "อัปเดตเมื่อ {when, date, long} เวลา {when, time, short}"
  },
  "Nav": {
    "feed": "ฟีด",
    "submit": "ส่งโปรเจกต์",
    "login": "เข้าสู่ระบบ"
  },
  "LocaleSwitcher": { "label": "ภาษา" }
}
```

### 5.9 Locale switcher — `src/components/locale-switcher.tsx`

```tsx
"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const labels: Record<string, string> = { en: "EN", th: "ไทย" };

export function LocaleSwitcher() {
  const t = useTranslations("LocaleSwitcher");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname(); // locale-stripped path, e.g. "/feed"

  return (
    <nav aria-label={t("label")}>
      {routing.locales.map((loc) => (
        <button
          key={loc}
          disabled={loc === locale}
          aria-current={loc === locale ? "true" : undefined}
          onClick={() => router.replace(pathname, { locale: loc })}
        >
          {labels[loc]}
        </button>
      ))}
    </nav>
  );
}
```

## 6. OpenNext / Cloudflare Workers pitfalls (with sources)

1. **`proxy.ts` runs only on the Node.js runtime in Next 16 — never add `export const runtime = 'edge'`.** With an edge export the build fails ("Route segment config is not allowed in Proxy file… Proxy always runs on Node.js runtime"). [Next.js 16 blog](https://nextjs.org/blog/next-16), [workers-sdk #13755](https://github.com/cloudflare/workers-sdk/issues/13755).
2. **Node middleware on OpenNext is experimental.** Supported since adapter 1.20.3, requires `nodejs_compat` (already set here). If it misbehaves on workerd, the drop-in fallback is renaming `src/proxy.ts` → `src/middleware.ts` (edge-style middleware is *fully* supported by OpenNext and next-intl's `createMiddleware` is edge-safe). [OpenNext releases](https://github.com/opennextjs/opennextjs-cloudflare/releases), [PR #1309](https://github.com/opennextjs/opennextjs-cloudflare/pull/1309), [CF OpenNext guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/opennext/).
3. **Don't import Node-only modules in the middleware.** The classic Workers failure is a generated middleware bundle importing `async_hooks` → 500s. next-intl's middleware itself is edge-safe; just don't wrap it with code using Node APIs. [workers-sdk #13755](https://github.com/cloudflare/workers-sdk/issues/13755).
4. **Every middleware rewrite/redirect costs a subrequest** through the worker (and via `WORKER_SELF_REFERENCE`). Keep the matcher tight (exclude `_next`, dotfiles, `/api`) and rely on `localePrefix: 'always'` so steady-state requests to `/en/*` / `/th/*` only do cookie-based negotiation, not rewrites. [OpenNext docs](https://opennextjs.org/cloudflare), [next-intl middleware docs](https://next-intl.dev/docs/routing/middleware).
5. **Prefer static rendering for locale pages.** `generateStaticParams` in `[locale]/layout.tsx` makes `/en/*` and `/th/*` prerendered — served straight from the R2 incremental cache (`NEXT_INC_CACHE_R2_BUCKET` binding) instead of re-rendered per request. With Next 16.3 root params, static rendering works without `setRequestLocale`. [next-intl root-params blog](https://next-intl.dev/blog/nextjs-root-params).
6. **Delete the pass-through `src/app/layout.tsx`.** With all pages under `[locale]`, the `[locale]/layout.tsx` must be the root layout (owns `<html>`/`<body>`); a leftover root layout silently becomes the root and breaks rendering. Use `global-not-found.tsx` (Next 16) for 404s outside the locale tree. [next-intl root-params blog](https://next-intl.dev/blog/nextjs-root-params).
7. **`rootParams.locale()` is not available in Route Handlers / Server Actions** — irrelevant here because API routes stay unlocalized, but remember it if you ever need the locale server-side outside pages. [next-intl root-params blog](https://next-intl.dev/blog/nextjs-root-params).
8. **Known-history build failures between next-intl middleware and OpenNext were adapter regressions, not next-intl bugs** (#683, fixed). If a build suddenly fails on the middleware chunk, check the adapter's issue tracker before restructuring i18n. [opennextjs-cloudflare #683](https://github.com/opennextjs/opennextjs-cloudflare/issues/683).
9. **Turbopack is the default bundler in Next 16.** next-intl's plugin works with Turbopack; adapter 1.20.3 also patched Turbopack wasm helpers for workerd. Verify any i18n-adjacent tooling is Turbopack-compatible. [Next.js 16 blog](https://nextjs.org/blog/next-16), [OpenNext releases](https://github.com/opennextjs/opennextjs-cloudflare/releases).
10. **Remove the `@cloudflare/next-on-pages` escape hatch from muscle memory.** It is edge-only and deadlocks against Next 16 `proxy.ts`; `wrangler dev`/`deploy` with `.open-next/worker.js` is the only supported path here. [workers-sdk #13755](https://github.com/cloudflare/workers-sdk/issues/13755).
11. **`dynamicParams = false` doesn't mix with `cacheComponents`** (not enabled here). If `cacheComponents` is ever turned on, drop that export and rely on the `hasLocale`/`notFound()` runtime validation in `request.ts`. [next-intl root-params blog](https://next-intl.dev/blog/nextjs-root-params).

## 7. Coexistence: locale-prefixed pages vs unlocalized `/api/*`

Three layers keep `/api/*` out of i18n:

1. **Filesystem**: route handlers stay at `src/app/api/**` (outside `[locale]`). Next.js matches concrete segments (`/api/auth/login`) before dynamic ones (`/[locale]/...`), so an API path can never fall into the locale segment.
2. **Middleware matcher**: `'/((?!api|_next|_vercel|.*\\..*).*)'` — next-intl's default matcher already excludes `/api`; keep the explicit `api` guard. API requests bypass locale negotiation entirely, so no redirect loops and no `NEXT_LOCALE` cookie churn from XHR/fetch calls. [next-intl middleware docs](https://next-intl.dev/docs/routing/middleware).
3. **Contract**: per the map's decision, API errors stay English (API responses are not translated); the frontend presents localized copy. Client code fetches `/api/...` with absolute paths (no locale prefix) and localizes presentation in UI components.

One residual nuance: the matcher's `.*\\..*` clause also keeps dot-path asset URLs (e.g. R2-delivered `/uploads/...`) away from locale redirects.

## 8. Thai-specific notes (th-TH)

- **No plurals**: Thai has one plural category (`other`) — no `Intl.PluralRules` complexity. Keep messages simple; ICU still useful for `{count, number}` formatting.
- **Dates default to the Buddhist calendar**: `Intl.DateTimeFormat("th-TH")` renders พ.ศ. years (e.g. 2569 BE for 2026 CE) — usually the desired Thai UX. English pages (`en`) stay Gregorian. The Workers runtime supports `Intl` ([CF web standards docs](https://developers.cloudflare.com/workers/runtime-apis/web-standards/)).
- **Thai digits are opt-in, not default**: CLDR's default numbering system for `th-TH` is `latn`; Thai digits (๑–๙) require `th-TH-u-nu-thai`. Keep counters/prices in Latin digits unless the design says otherwise.
- **Line breaking**: Thai text has no inter-word spaces. Browsers handle dictionary-based breaking with the default `line-break: auto`; avoid `whitespace-nowrap` on Thai strings and don't hard-truncate mid-string server-side (if you must, use `Intl.Segmenter` to break on word boundaries — [MDN](https://developer.mozilla.org/en-US/blog/javascript-intl-segmenter-i18n/)).
- **Fonts**: add a Thai-capable font to the Tailwind stack (e.g. Noto Sans Thai / IBM Plex Sans Thai via `next/font/google`) or Thai glyphs fall back inconsistently; `lang="th"` comes for free from the `[locale]` root layout.

## 9. Sources

- Next.js 16 announcement (proxy.ts, Turbopack, deprecations): https://nextjs.org/blog/next-16
- next-intl — root params / static rendering in Next 16.3: https://next-intl.dev/blog/nextjs-root-params
- next-intl — setRequestLocale deprecation tracking: https://github.com/amannn/next-intl/issues/663
- next-intl — App Router getting started: https://next-intl.dev/docs/getting-started/app-router
- next-intl — routing / middleware (proxy.ts convention, default matcher): https://next-intl.dev/docs/routing/middleware
- next-intl — runtime requirements (Intl APIs, polyfills): https://next-intl.dev/docs/environments/runtime-requirements
- next-intl — releases (v4.14.2 latest; 4.13.3 Next 16.3 compat prep): https://github.com/amannn/next-intl/releases
- next-intl — Cloudflare Pages-era issue (different adapter, historical): https://github.com/amannn/next-intl/issues/786
- OpenNext Cloudflare adapter — supported features: https://opennextjs.org/cloudflare and https://developers.cloudflare.com/workers/framework-guides/web-apps/opennext/
- OpenNext Cloudflare adapter — releases (1.20.3 experimental proxy.ts support; 1.20.6 pins Next 16.3.4): https://github.com/opennextjs/opennextjs-cloudflare/releases
- OpenNext Cloudflare adapter — Node middleware PR: https://github.com/opennextjs/opennextjs-cloudflare/pull/1309 (rejected predecessor: https://github.com/opennextjs/opennextjs-cloudflare/pull/1280)
- OpenNext Cloudflare adapter — next-intl middleware build bug (fixed): https://github.com/opennextjs/opennextjs-cloudflare/issues/683
- Next 16 proxy vs Cloudflare adapters deadlock (historical): https://github.com/cloudflare/workers-sdk/issues/13755
- Community report — next-intl + OpenNext on Workers pitfalls: https://marekurbanowicz.medium.com/kinde-next-intl-with-opennext-on-cloudflare-not-that-easy-atm-e837d7af0efa
- Paraglide JS — overview and Next.js integration: https://paraglidejs.com/ and https://paraglidejs.com/next-js
- Paraglide JS — SSR locale resolution on Workers (AsyncLocalStorage + nodejs_compat): https://github.com/opral/paraglide-js/blob/main/docs/server-side-rendering.md
- Cloudflare Workers — Intl API support: https://developers.cloudflare.com/workers/runtime-apis/web-standards/
- Intl.Segmenter background (Thai word segmentation): https://developer.mozilla.org/en-US/blog/javascript-intl-segmenter-i18n/
