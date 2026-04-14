# Chore Diary

Shared household planner for chores, meals, recipes, groceries, and activity history.

## Current App Scope

- household onboarding with invite-code join flow
- Today dashboard with meals, chores, groceries, and activity-driven revalidation
- recurring chores with complete/skip flows
- weekly meal planner with duplicate/edit/cooked states
- recipe library with ingredient autocomplete and custom tags
- groceries generated from meal plans plus manual items
- history feed with weekly household stats
- editable local display name from the dashboard sidebar

## Stack

- `Next.js 16`
- `React 19`
- `Prisma 7`
- `PostgreSQL / Supabase`
- `Clerk`
- `Tailwind CSS 4`

## Setup

Install dependencies:

```bash
npm install
```

Create the required environment variables in `.env.local`:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/today
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
DATABASE_URL=postgresql://postgres:password@db.project-ref.supabase.co:6543/postgres?pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://postgres:password@db.project-ref.supabase.co:5432/postgres
```

Run the app:

```bash
npm run dev
```

Optional seed run:

```bash
npx prisma db seed
```

Open:

- app: `http://localhost:3000`
- Prisma Studio if needed: `npx prisma studio`

## Important Notes

- Use `http://localhost:3000` during browser automation. Clerk rendered correctly on `localhost` during validation, while `127.0.0.1` produced a blank auth surface in Playwright.
- For Supabase plus Vercel/serverless, use the transaction-pooler `DATABASE_URL` on port `6543` for the running app and keep `DIRECT_URL` on port `5432` for Prisma CLI tasks like `migrate`, `seed`, and `studio`.
- Prisma migrations and local MCP/database tooling should use a reachable CLI connection string. If direct IPv6 access fails on your machine, use a Supabase pooler URL your environment can reach.
- `prisma/seed.ts` validates the bundled ingredient seed list on every run and can also create demo household recipes if `SEED_DEMO_CLERK_ID` and `SEED_DEMO_EMAIL` are set.
- Display names are stored locally in the app database. You can change the name shown in the app from the desktop sidebar edit button without changing your Clerk account profile.

## UX Notes

- `/today` and `/history` now include route loading skeletons.
- Dashboard routes share an error boundary via `src/app/(dashboard)/error.tsx`.
- Browser-facing auth automation should prefer `localhost` over `127.0.0.1`.

## Project Docs

- [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md): phase-by-phase build plan
- [CONVENTIONS.md](./CONVENTIONS.md): product and implementation conventions
- [AGENTS.md](./AGENTS.md): repo-specific agent instructions
