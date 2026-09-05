# AI Passport Marketplace

## Project Overview

A Product Hunt for AI Passport graduates — a community hub where Thai AI Passport learners register, post their projects, get discovered, and connect with each other. Each builder has a public portfolio profile tied to their AI Passport credential. The hub becomes worth visiting even before you've posted: discover what others are building, see what's trending, find collaborators.

Tech: Next.js on Cloudflare Pages, D1 database, R2 + Cloudflare Images storage, JWT auth (stateless, 7-day expiry, bcrypt cost 10).

**Design doc:** `docs/designs/ai-passport-marketplace.md` (APPROVED)
**Eng review plan:** `docs/eng-review-plan.md`

---

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill.

Key routing rules:
- Product ideas/brainstorming → invoke /office-hours
- Strategy/scope → invoke /plan-ceo-review
- Architecture → invoke /plan-eng-review
- Design system/plan review → invoke /design-consultation or /plan-design-review
- Full review pipeline → invoke /autoplan
- Bugs/errors → invoke /investigate
- QA/testing site behavior → invoke /qa or /qa-only
- Code review/diff check → invoke /review
- Visual polish → invoke /design-review
- Ship/deploy/PR → invoke /ship or /land-and-deploy
- Save progress → invoke /context-save
- Resume context → invoke /context-restore
- Author a backlog-ready spec/issue → invoke /spec
