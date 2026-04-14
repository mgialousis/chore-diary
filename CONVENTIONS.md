# Chore Diary — Project Conventions

This document defines the folder structure, naming patterns, component patterns, and library choices for the Chore Diary MVP. Follow these conventions in all generated code.

---

## Tech Stack

| Layer          | Choice                          | Notes                                      |
|----------------|----------------------------------|---------------------------------------------|
| Framework      | Next.js 14+ (App Router)        | Use `src/` directory                        |
| Language       | TypeScript (strict mode)        | No `any` types                              |
| Database       | PostgreSQL                      | Supabase or Neon                            |
| ORM            | Prisma                          | Schema in `prisma/schema.prisma`            |
| Auth           | Clerk (`@clerk/nextjs`)         | Middleware-based route protection           |
| UI Components  | shadcn/ui                       | Installed into `src/components/ui/`         |
| Styling        | Tailwind CSS                    | No custom CSS files unless unavoidable      |
| Icons          | `lucide-react`                  | Consistent icon set                         |
| Forms          | `react-hook-form` + `zod`       | All forms validated with zod schemas        |
| State          | React Server Components + hooks | No global state library for MVP             |
| Toasts         | shadcn `sonner`                 | For action feedback                         |
| Date handling  | `date-fns`                      | No moment.js                                |
| Deployment     | Vercel                          |                                             |

---

## Folder Structure

```
chore-diary/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts                      # Default categories, sample recipes
│   └── migrations/
├── public/
│   ├── manifest.json
│   ├── sw.js                        # Service worker
│   └── icons/                       # PWA icons
├── src/
│   ├── app/
│   │   ├── layout.tsx               # Root layout: ClerkProvider, ThemeProvider
│   │   ├── page.tsx                  # Redirect to /today
│   │   ├── sign-in/[[...sign-in]]/
│   │   │   └── page.tsx
│   │   ├── sign-up/[[...sign-up]]/
│   │   │   └── page.tsx
│   │   ├── onboarding/
│   │   │   └── page.tsx             # Create/join household
│   │   └── (dashboard)/
│   │       ├── layout.tsx           # Sidebar/bottom nav, household guard
│   │       ├── today/
│   │       │   └── page.tsx
│   │       ├── chores/
│   │       │   ├── page.tsx         # Chore list with filters
│   │       │   └── [id]/
│   │       │       └── page.tsx     # Edit chore template
│   │       ├── meals/
│   │       │   └── page.tsx         # Weekly meal planner
│   │       ├── recipes/
│   │       │   ├── page.tsx         # Recipe list
│   │       │   ├── new/
│   │       │   │   └── page.tsx     # Create recipe
│   │       │   └── [id]/
│   │       │       └── page.tsx     # Recipe detail / edit
│   │       ├── groceries/
│   │       │   └── page.tsx         # Grocery list
│   │       └── history/
│   │           └── page.tsx         # Activity log + stats
│   ├── components/
│   │   ├── ui/                      # shadcn components (auto-generated)
│   │   ├── layout/
│   │   │   ├── sidebar.tsx
│   │   │   ├── bottom-nav.tsx       # Mobile navigation
│   │   │   └── household-guard.tsx  # Redirects to onboarding if no household
│   │   ├── chores/
│   │   │   ├── chore-card.tsx
│   │   │   ├── chore-form.tsx
│   │   │   └── chore-filters.tsx
│   │   ├── meals/
│   │   │   ├── meal-calendar.tsx
│   │   │   ├── meal-slot.tsx
│   │   │   └── meal-form-modal.tsx
│   │   ├── recipes/
│   │   │   ├── recipe-card.tsx
│   │   │   ├── recipe-form.tsx
│   │   │   └── ingredient-input.tsx # Structured ingredient row input
│   │   ├── groceries/
│   │   │   ├── grocery-list.tsx
│   │   │   ├── grocery-item.tsx
│   │   │   └── add-grocery-form.tsx
│   │   └── history/
│   │       ├── activity-feed.tsx
│   │       └── stats-cards.tsx
│   ├── lib/
│   │   ├── db.ts                    # Prisma client singleton
│   │   ├── auth.ts                  # Clerk helpers: getCurrentUser, requireAuth
│   │   ├── household.ts            # getHouseholdForUser, requireHousehold
│   │   └── utils.ts                # cn() helper, date formatters
│   ├── actions/
│   │   ├── chores.ts               # Server actions: createChore, completeChore, etc.
│   │   ├── meals.ts                # Server actions: planMeal, markCooked, etc.
│   │   ├── recipes.ts             # Server actions: createRecipe, updateRecipe, etc.
│   │   ├── groceries.ts           # Server actions: generateGroceries, addManualItem, etc.
│   │   ├── household.ts           # Server actions: createHousehold, joinHousehold
│   │   └── activity.ts            # Server action: logActivity (internal, called by others)
│   ├── types/
│   │   └── index.ts               # Shared TypeScript types and interfaces
│   └── middleware.ts               # Clerk auth middleware
├── .env.local                      # CLERK keys, DATABASE_URL
├── .env.example                    # Template with placeholder values
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
| Server actions     | camelCase verbs       | `createChore`, `completeChore`     |
| Database fields    | snake_case (Prisma)   | `assigned_user_id`, `due_date`     |
| TypeScript types   | PascalCase            | `ChoreWithTemplate`, `MealPlanWithRecipe` |
| Zod schemas        | camelCase + Schema    | `choreFormSchema`, `recipeFormSchema` |
| CSS classes        | Tailwind only         | No custom class names              |
| Route params       | `[id]`                | `/recipes/[id]/page.tsx`           |
| Environment vars   | SCREAMING_SNAKE       | `DATABASE_URL`, `CLERK_SECRET_KEY` |

---

## Component Patterns

### Server vs Client Components

- **Pages** (`page.tsx`): Server Components by default. Fetch data here.
- **Interactive components**: Add `"use client"` only when needed (forms, click handlers, state).
- **Data fetching**: Always in Server Components or Server Actions. Never fetch in client components directly.

### Form Pattern

All forms follow this structure:

```tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  // ...fields
});

type FormValues = z.infer<typeof formSchema>;

export function ChoreForm({ onSubmit }: { onSubmit: (data: FormValues) => Promise<void> }) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "" },
  });
  const router = useRouter();

  async function handleSubmit(data: FormValues) {
    try {
      await onSubmit(data);
      toast.success("Chore created");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    }
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)}>
      {/* Use shadcn Form components */}
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

### Prisma Client Singleton

```tsx
// src/lib/db.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const db = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
```

---

## UI Patterns

### Modal/Dialog

Use shadcn `Dialog` for create/edit forms:

```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button>Add Chore</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>New Chore</DialogTitle>
    </DialogHeader>
    <ChoreForm onSubmit={createChore} />
  </DialogContent>
</Dialog>
```

### Loading States

Use shadcn `Skeleton` for loading states in server components:

```tsx
// loading.tsx (Next.js convention)
export default function Loading() {
  return <Skeleton className="h-[200px] w-full" />;
}
```

### Empty States

Every list page must have an empty state:

```tsx
{items.length === 0 ? (
  <div className="text-center py-12 text-muted-foreground">
    <p>No chores yet</p>
    <Button variant="outline" className="mt-4">Add your first chore</Button>
  </div>
) : (
  <div className="space-y-3">{items.map(...)}</div>
)}
```

### One-Tap Actions

Use optimistic updates for completion actions:

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
      {optimisticStatus === "COMPLETED" ? "Done ✓" : "Mark Done"}
    </Button>
  );
}
```

---

## Navigation

### Desktop: Sidebar

Vertical sidebar with icon + label for each section:
Today, Chores, Meals, Recipes, Groceries, History.

### Mobile: Bottom Navigation Bar

5 tabs max on mobile (combine History into a sub-nav or menu):
Today, Chores, Meals, Recipes, Groceries.

Detect screen size with Tailwind breakpoints:
- `md:` and above → show sidebar, hide bottom nav
- below `md` → show bottom nav, hide sidebar

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
# .env.example
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
5. **All pages have loading.tsx and empty states.**
6. **Mobile-first responsive design.** Build for phone screens first, enhance for desktop.
7. **Server Actions for mutations, Server Components for reads.**
8. **revalidatePath after every mutation** to keep the UI in sync.
9. **Activity logging on every meaningful action.** Call `logActivity()` in every server action that changes state.
10. **No effort points in MVP.** Track completion counts only.
