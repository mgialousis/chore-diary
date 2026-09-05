# Local development and troubleshooting

This document keeps operational notes out of the main product overview while preserving details useful to contributors.

## Database connections

Use Node.js 22.18+ within the 22.x line. Run `npm ci`, copy `.env.example` to
`.env.local`, and fill in your own database and Clerk configuration. Prisma's
config uses `@next/env`, so migrations, seeding, and Studio read the same
environment files as Next.js. Shell variables take precedence over files.
In test mode, `.env.local` is deliberately not loaded.

For Supabase on Vercel or another serverless runtime, use the transaction-pooler URL on port `6543` for `DATABASE_URL`, with PgBouncer mode enabled and a small connection limit. Keep `DIRECT_URL` on port `5432` for Prisma CLI tasks such as migrations, seeding, and Studio.

Prisma migrations and local database tooling need a connection that is reachable from the development machine. If direct IPv6 connectivity is unavailable, use a Supabase pooler URL supported by the local network.

```bash
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
npx prisma studio
```

The seed script always validates `prisma/data/ingredients.json`. It creates optional demonstration recipes only when `SEED_DEMO_CLERK_ID` and `SEED_DEMO_EMAIL` are provided. `SEED_DEMO_NAME` and `SEED_DEMO_HOUSEHOLD` customize those records.

For an interactive demo, first sign in to your development Clerk application,
then use that development user's Clerk ID and email for the seed variables.
Use a disposable development database, never a production household. The seed
command is registered in `prisma.config.ts` (Prisma 7); it inherits the loaded
environment and does not need a second `--env-file` argument. Regenerate the
client after schema changes with `npx prisma generate`.

## Browser automation

Use `http://localhost:3000` for local browser automation. During project validation, Clerk rendered correctly on `localhost`; the `127.0.0.1` origin produced a blank authentication surface in Playwright.

## UI implementation notes

- `/today` and `/history` provide route-level loading skeletons.
- Dashboard routes share the error boundary at `src/app/(dashboard)/error.tsx`.
- Display names are stored in the application database and can be edited from the desktop sidebar without changing the Clerk profile.

## Verification

Run all repository checks before opening a pull request:

```bash
npm run lint
npm test
npm run build
```
