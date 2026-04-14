# Chore Diary

Shared household planner for chores, meals, recipes, groceries, and activity history.

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
DATABASE_URL=postgresql://...
```

Run the app:

```bash
npm run dev
```

Open:

- app: `http://localhost:3000`
- Prisma Studio if needed: `npx prisma studio`

## Important Notes

- Use `http://localhost:3000` during browser automation. Clerk rendered correctly on `localhost` during validation, while `127.0.0.1` produced a blank auth surface in Playwright.
- Prisma migrations and MCP database access should use a reachable Supabase connection string. If direct IPv6 access fails, use the Supabase pooler for tooling that supports it.

## Project Docs

- [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md): phase-by-phase build plan
- [CONVENTIONS.md](./CONVENTIONS.md): product and implementation conventions
- [AGENTS.md](./AGENTS.md): repo-specific agent instructions
