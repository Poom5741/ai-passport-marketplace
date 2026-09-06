---
parent: ../map.md
labels: [task]
task_id: rc-5
created: 2026-09-06
state: open
---

## Question

What do the register and login pages look like, wired to the existing auth API?

## Scope

- `/[locale]/register` and `/[locale]/login` pages: forms calling existing `POST /api/auth/register` / `login`; error display (domain rule, password length, 409 duplicate, 401 invalid, 429 rate limit) translated in both locales.
- On success: redirect to own profile; auth cookie set by API (HttpOnly).
- Signed-in users visiting these pages get redirected away.

## Acceptance

- Full flow works in `wrangler dev` for both locales: register → redirected in; logout (add a `POST /api/auth/logout` clearing the cookie — currently missing) → logged out.
- Duplicate email and invalid domain show translated errors.
