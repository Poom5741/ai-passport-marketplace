---
parent: docs/wayfinder/map.md
labels: [wayfinder:map, wayfinder:grilling]
created: 2026-09-05
assignee: zcode
state: closed
resolution: |
  AI Passport learners only. Verification via @ai-passport.go.th email domain restriction.
  Known limitation: learners using personal email are excluded. Noted as acceptable tradeoff for MVP.
  Credential badge deferred to post-MVP (doesn't block registration).
---

## Question

**Who can register on AI Passport Marketplace?**

The design doc says "anyone can register for MVP" but the entire premise of the product is that it's a hub *for AI Passport learners* — people who completed Thailand's government AI training. The moment you open registration to anyone, you become a generic project showcase with no tie to AI Passport at all.

This question cascades into everything:
- Auth flow (email domain restriction? Government ID verification?)
- Profile page (does it show an AI Passport credential badge or nothing?)
- Go-to-market (how do you attract real AI Passport learners vs. random visitors?)
- Moderation (if anyone can post, spam risk is higher)

Options:
- **AI Passport learners only** — verify via email domain (`@ai-passport.go.th`?) or manual approval. This is the "real" product but adds verification friction.
- **Anyone can register, credential badge deferred** — ship the hub now, add badge verification later. Loses the "AI Passport" identity but gets users faster.
- **Registration requires an invite code** — invite codes distributed through AI Passport courses. Balances friction with quality.

**Which is the right answer for a learner showcase that wants real AI Passport builders?**
