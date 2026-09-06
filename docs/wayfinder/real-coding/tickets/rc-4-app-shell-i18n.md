---
parent: ../map.md
labels: [task]
task_id: rc-4
created: 2026-09-06
state: open
---

## Question

What is the app skeleton every page builds on?

## Scope

- i18n skeleton per rc-1's resolution: `[locale]` routing, middleware (locale detect/redirect), `en.json` + `th.json` dictionaries, locale switcher component.
- App shell: header (logo, feed link, locale switcher, auth-aware "submit project"/"sign in" slot), footer, base typography on existing Tailwind zinc theme.
- All existing pages move under `src/app/[locale]/`; `/api/*` stays unlocalized.
- Client-side session hook/context so nav reflects auth state.

## Acceptance

- `/` redirects to `/en` (or `/th` by Accept-Language); both locales render the shell.
- `bun run build` + `wrangler dev` work on the Workers runtime.
