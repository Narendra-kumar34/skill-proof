# SkillProof

> Prove you can apply what you learn.

SkillProof is an AI-powered practical skill assessment platform for working professionals. Learners attempt realistic workplace challenges, get rubric-based AI feedback, and build an evidence-backed skill profile.

Product brief: [docs/skillproof.md](docs/skillproof.md)

> This README grows with the project. Architecture, trade-offs and security notes are added as the build progresses.

## Tech stack

- **Next.js 16** (App Router, Cache Components, typed routes) with **TypeScript** (strict)
- **Tailwind CSS v4** + **shadcn/ui** (Radix)
- **PostgreSQL** (Neon) + Drizzle ORM _(Phase 1)_
- **Better Auth** with role-based access _(Phase 1)_
- **Vercel AI SDK** + Google Gemini _(Phase 2)_
- **Vitest** (unit/integration) + **Playwright** (E2E)
- **GitHub Actions** CI → **Vercel** CD

## Getting started

Requires Node.js 24 (see `.nvmrc`).

```bash
npm install
cp .env.example .env.local   # then fill in values
npm run db:migrate           # create tables
npm run db:seed              # load skills, challenges and rubrics (idempotent)
npm run dev
```

Open http://localhost:3000 and click **Try the demo** for a pre-populated account, or create your own.

To get an admin account, set `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` in `.env.local` before running `npm run db:seed`.

## Database

- Schema lives in `src/db/schema/` (Drizzle). After changing it, run `npm run db:generate` and commit the new file in `drizzle/`. CI fails if the schema and migrations drift apart.
- Migrations run automatically on Vercel deploys (`vercel-build`). Seeding is a manual, one-off step so it never overwrites admin edits.

## Scripts

| Script                 | What it does                                     |
| ---------------------- | ------------------------------------------------ |
| `npm run dev`          | Start the dev server                             |
| `npm run build`        | Production build                                 |
| `npm run lint`         | ESLint                                           |
| `npm run typecheck`    | Generate route types, then `tsc --noEmit`        |
| `npm run format`       | Format with Prettier                             |
| `npm run format:check` | Verify formatting (used in CI)                   |
| `npm test`             | Run unit tests once                              |
| `npm run check`        | Everything CI runs except the build, in one step |

## CI/CD

- **CI** — `.github/workflows/ci.yml` runs lint, typecheck, format check, tests and a production build on every push to `main` and every pull request.
- **CD** — Vercel's Git integration deploys every push: previews for pull requests, production for `main`.
