# Intake — AI Passport Marketplace: Full Build

## Task
Implement all cards from the wayfinder map (`docs/wayfinder/real-coding/map.md`) — the end-to-end working product: bilingual project feed, auth, project submission with screenshot upload to R2, public profiles, deduplicated view counts, and E2E tests.

## References
- Design doc: `docs/designs/ai-passport-marketplace.md`
- Wayfinder map: `docs/wayfinder/real-coding/map.md`
- Handoff (keep R2): `HANDOFF-T1-CLOUDFLARE-IMAGES.md`
- i18n research: `docs/wayfinder/real-coding/research/rc1-i18n-approach.md`

## Q1 · construct · 2026-09-06
Question: Run with multiple worker agents in parallel, or single-agent inline?
My guess: multi — user explicitly asked for parallel subagent dispatch
Answer:   multi — dispatch independent tickets as parallel subagents
Locks:    agents mode = multi for all subsequent tickets

## Q2 · construct · 2026-09-06
Question: Loop through all tasks until done, or stop after each for review?
My guess: loop — user wants all cards implemented
Answer:   loop — implement all tickets end-to-end without stopping
Locks:    loop mode = loop

## Q3 · construct · 2026-09-06
Question: Commit consent — summarize-and-wait, or pre-approve commits?
My guess: gate — default, user didn't specify
Answer:   gate — summarize and wait for approval before committing
Locks:    commits mode = gate (default)

## Q4 · blueprint · 2026-09-06
Question: Build ambition — MVP or full/production?
My guess: MVP — core happy path, minimal surface, ship fast
Answer:   MVP — lean build, core features only, iterate after first working build
Locks:    ambition = MVP for all tickets

## Q5 · define · 2026-09-06
Question: i18n approach — [locale] path segment, which library?
My guess: custom dictionary with [locale] path segment
Answer:   Custom dictionary + [locale] path segment, no third-party library (rc-1 research confirmed: safest for OpenNext/Cloudflare)
Locks:    i18n = custom dictionary, [locale] routing, proxy.ts

## Q6 · define · 2026-09-06
Question: Upload storage — Cloudflare Images or R2?
My guess: R2 — no subscription needed, simpler
Answer:   R2 via UPLOADS binding, delivery via in-app /api/files/{key} route
Locks:    upload = R2, no Cloudflare Images
