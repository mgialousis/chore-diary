# Chore Diary — Project Conventions

This document defines the folder structure, naming patterns, component patterns, and library choices for the Chore Diary MVP. Follow these conventions in all generated code.

---

## Tech Stack

| Layer          | Choice                          | Notes                                      |
|----------------|----------------------------------|---------------------------------------------|
| Framework      | Next.js 16 (App Router)         | Use `src/` directory                        |
| Language       | TypeScript (strict mode)        | No `any` types                              |
| Database       | PostgreSQL (Supabase)           |                                             |
| ORM            | Prisma 7                        | Config in `prisma.config.ts`, pg adapter    |
| Auth           | Clerk (`@clerk/nextjs`)         | Proxy-based route protection (`proxy.ts`)   |
| UI Components  | shadcn/ui (Nova preset)         | Installed into `src/components/ui/`         |
| Styling        | Tailwind CSS                    | No custom CSS files unless unavoidable      |
| Icons          | `lucide-react`                  | Consistent icon set                         |
| Forms          | `react-hook-form` + `zod`       | All forms validated with zod schemas        |
| State          | React Server Components + hooks | No global state library for MVP             |
| Toasts         | `sonner`                        | For action feedback                         |
| Date handling  | `date-fns`                      | No moment.js                                |
| Deployment     | Vercel                          |                                             |

### Key Version Notes

- **Next.js 16**: `middleware.ts` is renamed to `proxy.ts`. The exported function must be named `proxy` or be a default export.
- **Prisma 7**: The `datasource` block has no `url` property. Connection URL is configured in `prisma.config.ts`. The client engine requires an `adapter` (we use `@prisma/adapter-pg` via `PrismaPg`).
- **Zod v4**: `error.errors` is renamed to `error.issues`. Use `.issues[0].message` for first error.
- **Next.js 16 searchParams/params**: These are now `Promise` types in page components and must be awaited.

---

## Folder Structure

```
chore-diary/
├── prisma/
│   ├── schema.prisma
│   ├── prisma.config.ts             # Prisma 7 config (datasource URL, earlyAccess)
│   ├── data/
│   │   └── ingredients.json         # ~150 seed ingredients for autocomplete
│   └── migrations/
├── public/
│   ├── manifest.json
│   └── icons/                       # PWA icons
├── src/
│   ├── app/
│   │   ├── layout.tsx               # Root layout: ClerkProvider, Toaster
│   │   ├── page.tsx                  # Redirect to /today
│   │   ├── sign-in/[[...sign-in]]/
│   │   │   └── page.tsx
│   │   ├── sign-up/[[...sign-up]]/
│   │   │   └── page.tsx
│   │   ├── onboarding/
│   │   │   └── page.tsx             # Create/join household
│   │   └── (dashboard)/
│   │       ├── layout.tsx           # Sidebar/bottom nav, household guard
│   │       ├── error.tsx            # Error boundary for dashboard routes
│   │       ├── today/
│   │       │   ├── page.tsx         # Daily overview (meals, chores, groceries)
│   │       │   └── loading.tsx
│   │       ├── chores/
│   │       │   ├── page.tsx         # Chore list with filters
│   │       │   └── loading.tsx
│   │       ├── meals/
│   │       │   ├── page.tsx         # Weekly meal planner
│   │       │   └── loading.tsx
│   │       ├── recipes/
│   │       │   ├── page.tsx         # Recipe list with search + tag filtering
│   │       │   ├── loading.tsx
│   │       │   ├── new/
│   │       │   │   └── page.tsx     # Create recipe
│   │       │   └── [id]/
│   │       │       └── page.tsx     # Recipe detail / edit
│   │       ├── groceries/
│   │       │   ├── page.tsx         # Grocery list (auto-generated + manual)
│   │       │   └── loading.tsx
│   │       └── history/
│   │           ├── page.tsx         # Activity log + weekly stats
│   │           └── loading.tsx
│   ├── components/
│   │   ├── ui/                      # shadcn components (auto-generated)
│   │   ├── layout/
│   │   │   ├── sidebar.tsx          # Desktop nav + invite code + display name editing
│   │   │   └── bottom-nav.tsx       # Mobile navigation
│   │   ├── chores/
│   │   │   ├── chore-card.tsx       # Optimistic done/skip with useOptimistic
│   │   │   ├── chore-form.tsx       # react-hook-form + zod
│   │   │   ├── chore-filters.tsx    # Owner + category client-side filters
│   │   │   └── chore-list.tsx       # Sections: due today, overdue, upcoming, done
│   │   ├── meals/
│   │   │   ├── meal-calendar.tsx    # Desktop 7-col grid + mobile vertical list
│   │   │   ├── meal-slot.tsx        # Empty/filled states, actions dropdown
│   │   │   └── meal-form-modal.tsx  # Sheet: recipe search or custom meal name
│   │   ├── recipes/
│   │   │   ├── recipe-card.tsx      # Card with name, tags, prep time, servings
│   │   │   ├── recipe-form.tsx      # Ingredients with useFieldArray
│   │   │   ├── recipe-actions.tsx   # Edit dialog + delete confirmation
│   │   │   └── ingredient-input.tsx # Quantity + unit + name row
│   │   ├── groceries/
│   │   │   ├── grocery-list.tsx     # Sections: meal plan, manual, bought
│   │   │   ├── grocery-item.tsx     # Aggregated + manual item variants
│   │   │   └── add-grocery-form.tsx # Inline form with ingredient autocomplete
│   │   ├── shared/
│   │   │   └── ingredient-name-input.tsx  # Debounced autocomplete for ingredient names
│   │   ├── today/
│   │   │   ├── today-meals.tsx      # Lunch/dinner cards with mark-cooked
│   │   │   ├── today-chores.tsx     # Due + overdue with done/skip
│   │   │   └── today-groceries.tsx  # Snapshot with mark-bought
│   │   ├── history/
│   │   │   ├── activity-feed.tsx    # Paginated feed with type filters
│   │   │   └── stats-cards.tsx      # Weekly chore/meal/grocery counts
│   │   └── onboarding/
│   │       └── onboarding-form.tsx  # Create/join household tabs
│   ├── lib/
│   │   ├── db.ts                    # Prisma client singleton (PrismaPg adapter)
│   │   ├── auth.ts                  # getCurrentUser (upsert from Clerk), requireAuth
│   │   ├── household.ts             # getHouseholdForUser, requireHousehold, getHouseholdMembers
│   │   ├── date.ts                  # toDateOnly (UTC noon), toDateKey
│   │   └── utils.ts                 # cn() helper (clsx + twMerge)
│   ├── actions/
│   │   ├── chores.ts               # createChoreTemplate, completeChore, skipChore, generateInstances
│   │   ├── meals.ts                # planMeal (upsert), markMealCooked, removeMeal, duplicateMeal
│   │   ├── recipes.ts              # createRecipe, updateRecipe, deleteRecipe, getIngredientSuggestions
│   │   ├── groceries.ts            # generateGroceryList, addManualItem, toggleChecked, markBought, clearBought
│   │   ├── household.ts            # createHousehold, joinHousehold
│   │   ├── user.ts                 # updateDisplayName
│   │   └── activity.ts             # logActivity (internal, called by other actions)
│   ├── types/
│   │   └── index.ts                # Zod schemas + composite Prisma types
│   └── proxy.ts                    # Clerk auth middleware (Next.js 16 convention)
├── .env.local                      # CLERK keys, DATABASE_URL
├── prisma.config.ts                # Prisma 7 config
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Naming Conventions

| Thing              | Convention            | Example                            |
|--------------------|-----------------------|------------------------------------|
| Files/folders      | kebab-case            | `chore-card.tsx`, `meal-form-modal.tsx` |
| React components   | PascalCase            | `ChoreCard`, `MealFormModal`       |
| Server actions     | camelCase verbs       | `createChoreTemplate`, `completeChore` |
| Database fields    | snake_case (Prisma)   | `assigned_user_id`, `due_date`     |
| TypeScript types   | PascalCase            | `ChoreInstanceWithTemplate`, `MealPlanWithDetails` |
| Zod schemas        | camelCase + Schema    | `choreTemplateSchema`, `mealPlanSchema` |
| CSS classes        | Tailwind only         | No custom class names              |
| Route params       | `[id]`                | `/recipes/[id]/page.tsx`           |
| Environment vars   | SCREAMING_SNAKE       | `DATABASE_URL`, `CLERK_SECRET_KEY` |

---

## Component Patterns

### Server vs Client Components

- **Pages** (`page.tsx`): Server Components by default. Fetch data here with `Promise.all` for parallel queries.
- **Interactive components**: Add `"use client"` only when needed (forms, click handlers, state).
- **Data fetching**: Always in Server Components or Server Actions. Never fetch in client components directly (except for autocomplete/search via server actions).

### Form Pattern

All forms follow this structure:

```tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

type FormValues = z.infer<typeof formSchema>;

export function MyForm({ onSuccess }: { onSuccess?: () => void }) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "" },
  });

  async function onSubmit(data: FormValues) {
    const result = await myServerAction(data);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Saved");
      onSuccess?.();
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Fields + submit button */}
    </form>
  );
}
```

### Server Action Pattern

```tsx
"use server";

import { db } from "@/lib/db";
import { requireHousehold } from "@/lib/household";
import { logActivity } from "@/actions/activity";
import { revalidatePath } from "next/cache";

export async function completeChore(choreInstanceId: string) {
  const { household, user } = await requireHousehold();

  const chore = await db.choreInstance.update({
    where: { id: choreInstanceId, householdId: household.id },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
      completedByUserId: user.id,
    },
  });

  await logActivity({
    householdId: household.id,
    userId: user.id,
    eventType: "CHORE_COMPLETED",
    entityType: "chore",
    entityId: chore.id,
    message: `${user.name} completed ${chore.name}`,
  });

  revalidatePath("/today");
  revalidatePath("/chores");
}
```

### Prisma Client Singleton (Prisma 7 + pg adapter)

```tsx
// src/lib/db.ts
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
```

### Date Handling

All dates stored in Prisma `@db.Date` columns use UTC noon to avoid timezone drift:

```tsx
// src/lib/date.ts
export function toDateOnly(date: Date) {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12));
}
```

Always call `toDateOnly()` when constructing dates for Prisma queries or writes.

---

## UI Patterns

### Optimistic UI

Use `useOptimistic` + `useTransition` for instant feedback on completion actions:

```tsx
"use client";
import { useOptimistic, useTransition } from "react";

export function ChoreCard({ chore }) {
  const [isPending, startTransition] = useTransition();
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(chore.status);

  function handleComplete() {
    startTransition(async () => {
      setOptimisticStatus("COMPLETED");
      await completeChore(chore.id);
    });
  }

  return (
    <Button
      onClick={handleComplete}
      disabled={isPending || optimisticStatus === "COMPLETED"}
    >
      {optimisticStatus === "COMPLETED" ? "Done" : "Mark Done"}
    </Button>
  );
}
```

### Loading States

Every dashboard route has a `loading.tsx` using shadcn `Skeleton` components matching the page layout.

### Empty States

Every list page has an empty state with a call-to-action when no data exists.

---

## Navigation

### Desktop: Sidebar

Vertical sidebar with icon + label: Today, Chores, Meals, Recipes, Groceries, History. Includes household name, user avatar, display name editing, and invite code with copy button.

### Mobile: Bottom Navigation Bar

5 tabs: Today, Chores, Meals, Recipes, Groceries. History is accessible from the sidebar on desktop only.

Detect screen size with Tailwind breakpoints:
- `md:` and above: show sidebar, hide bottom nav
- Below `md`: show bottom nav, hide sidebar

---

## Data Access Pattern

All data queries must be scoped to the current user's household:

```tsx
// ALWAYS include householdId in WHERE clauses
const chores = await db.choreInstance.findMany({
  where: {
    householdId: household.id,  // NEVER omit this
    dueDate: { lte: today },
    status: "PENDING",
  },
  orderBy: { dueDate: "asc" },
});
```

---

## Environment Variables

```bash
# .env.local
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/today"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/onboarding"
```

---

## Git Conventions

- Branch naming: `feature/chore-system`, `fix/grocery-merge-bug`
- Commit messages: imperative mood, e.g., "Add chore completion with activity logging"
- One feature per PR when possible

---

## Important Rules

1. **Every query is household-scoped.** No exceptions.
2. **No `any` types.** Use proper TypeScript types or Prisma generated types.
3. **All forms use zod validation.** Both client-side and in server actions.
4. **One-tap actions use optimistic UI.** Completion buttons must feel instant.
5. **All dashboard routes have loading.tsx and empty states.**
6. **Mobile-first responsive design.** Build for phone screens first, enhance for desktop.
7. **Server Actions for mutations, Server Components for reads.**
8. **revalidatePath after every mutation** to keep the UI in sync.
9. **Activity logging on every meaningful action.** Call `logActivity()` in every server action that changes state.
10. **No effort points in MVP.** Track completion counts only.
11. **Use `toDateOnly()` for all date comparisons** to avoid timezone drift with `@db.Date` columns.
12. **Await `searchParams` and `params`** in page components (Next.js 16 requirement).
