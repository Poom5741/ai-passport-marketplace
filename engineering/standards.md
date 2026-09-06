# Standards — AI Passport Marketplace

Stack:           Next.js 16 App Router, React 19, TypeScript, Tailwind CSS (zinc palette),
                 Cloudflare Pages (OpenNext), D1 (SQLite), R2, KV, Drizzle ORM, bcryptjs, jose JWT
Test tooling:    Vitest (unit), Playwright (E2E)
Conventions:     App Router file-based routing, src/app/api/ for API routes,
                 src/lib/ for shared utilities, src/drizzle/schema.ts for DB schema,
                 error responses { error: string }, consistent use of getSession() for auth,
                 getCloudflareEnv() + createDB() for DB access
Branch format:   main (direct commits for now)
Commit format:   conventional commits (feat:, fix:, chore:)
Copy source:     bilingual (EN/TH) via [locale] segment — TBD (rc-1 research)
Domain terms:    project = a learner submitted AI project; tag = normalized lowercase label;
                 view_count = deduplicated per IP+UA per hour; repo_url = optional GitHub link
