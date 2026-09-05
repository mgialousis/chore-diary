# Chore Diary

[![CI](https://github.com/mgialousis/chore-diary/actions/workflows/ci.yml/badge.svg)](https://github.com/mgialousis/chore-diary/actions/workflows/ci.yml)

Chore Diary is a responsive household planner that keeps recurring chores, weekly meals, recipes, and groceries in one shared workspace. It turns a meal plan into an actionable grocery list and records household activity, so two people can coordinate without switching between several apps.

## Product highlights

- A focused Today dashboard for due and overdue chores, meals, and groceries
- Recurring chores with assignees, completion, skipping, postponement, and category filters
- A weekly lunch-and-dinner planner with reusable recipes and serving counts
- Grocery aggregation that scales recipe quantities and merges matching ingredients
- Private two-person households with invite-code onboarding
- A filterable activity history and weekly contribution statistics
- Responsive navigation, loading skeletons, optimistic interactions, and PWA metadata

## Engineering highlights

- Next.js 16 App Router with React Server Components and Server Actions
- Strict TypeScript and Zod validation at form and action boundaries
- Household-scoped Prisma queries backed by PostgreSQL
- Clerk authentication with authorization repeated inside protected server operations
- Pure recurrence scheduling logic covered by deterministic unit tests
- Automated lint, test, and production-build checks in GitHub Actions

## Architecture

```text
Browser
  └─ Next.js App Router (Server + Client Components)
       ├─ Clerk authentication
       └─ Server Actions (validation + household authorization)
            └─ Prisma 7 + PostgreSQL adapter
                 └─ PostgreSQL / Supabase
```

Pages fetch household data on the server. Interactive forms submit to Server Actions, which validate input, resolve the authenticated household, perform household-scoped database operations, log relevant activity, and revalidate affected routes.

## Tech stack

| Area | Technology |
| --- | --- |
| Web | Next.js 16, React 19, TypeScript |
| UI | Tailwind CSS 4, shadcn/ui, Radix UI |
| Forms | React Hook Form, Zod |
| Data | Prisma 7, PostgreSQL / Supabase |
| Authentication | Clerk |
| Testing and quality | Vitest, ESLint, GitHub Actions |
| Deployment | Vercel |

## Run locally

Prerequisites: Node.js 22, a PostgreSQL database, and a Clerk application.

```bash
git clone https://github.com/mgialousis/chore-diary.git
cd chore-diary
npm ci
cp .env.example .env.local
```

Replace the placeholder values in `.env.local`, then prepare the database and start the app:

```bash
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). More detail about database connections, optional demo seeding, and local tooling is in [docs/LOCAL_DEVELOPMENT.md](./docs/LOCAL_DEVELOPMENT.md).

## Environment variables

| Variable | Purpose | Exposure |
| --- | --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk browser SDK | Public by design |
| `CLERK_SECRET_KEY` | Clerk server SDK | Server only |
| `DATABASE_URL` | Runtime PostgreSQL connection | Server only |
| `DIRECT_URL` | Prisma CLI connection | Server only |
| `NEXT_PUBLIC_CLERK_*_URL` | Local auth route configuration | Public by design |

`.env.example` contains placeholders only. All `.env*` files are ignored except that template; never commit `.env.local` or production credentials.

## Security and privacy

- Clerk owns authentication; private application keys remain server-side.
- Server Actions call `requireAuth` or `requireHousehold` and scope database operations to the authenticated household.
- Household data is separated by `householdId`, and invite codes are required to join.
- The application stores household planning data and the Clerk-linked name/email needed for membership. It does not include analytics or advertising SDKs.
- Secrets are supplied through environment variables and are not embedded in source control.

This is a portfolio project, not a security-certified service. A production deployment should additionally define rate limits, monitoring, backups, retention rules, and a published privacy policy.

## Quality checks

```bash
npm run lint
npm test
npm run build
```

The test suite covers recurrence scheduling edge cases and core validation rules. GitHub Actions runs the same checks for pushes and pull requests using explicit non-production placeholder configuration.

## Further documentation

- [Local development and troubleshooting](./docs/LOCAL_DEVELOPMENT.md)
- [Implementation guide](./IMPLEMENTATION_GUIDE.md)
- [Project conventions](./CONVENTIONS.md)
- [Repository-specific agent guidance](./AGENTS.md)

## License

Copyright (C) 2026 Miltiadis Gialousis.

This project's original code and content are licensed under the
[GNU Affero General Public License version 3 only](LICENSE)
(`AGPL-3.0-only`). You may use, modify, and redistribute them, including
commercially, under the license's terms. Distributed covered works must
provide corresponding source under those terms. If you modify the software
and let users interact with it remotely over a network, you must offer those
users the corresponding source of your modified version.

The software is provided without warranty. Third-party dependencies and any
separately licensed material retain their respective licenses and notices.
