# Chore Diary — Complete Implementation Guide for Coding Agents

## INSTRUCTIONS FOR THE CODING AGENT

You are building a shared household planner web app called "Chore Diary". This document is your single source of truth. Follow each phase in order. Do not skip ahead. After completing each phase, verify all acceptance criteria before moving to the next.

**Your working environment:**
- Project already scaffolded with `create-next-app` (Next.js 16, App Router, TypeScript, Tailwind CSS, `src/` directory)
- shadcn/ui already initialized (Nova preset, Radix, Lucide icons, Geist font)
- Prisma 7 already initialized (`prisma.config.ts` + `prisma/schema.prisma`)
- Clerk account created, keys in `.env.local`
- PostgreSQL database (Supabase) connected, URL in `.env`
- Dependencies already installed: `@clerk/nextjs`, `prisma`, `@prisma/client`, `react-hook-form`, `@hookform/resolvers`, `zod`, `date-fns`, `sonner`, `lucide-react`

**Read `CONVENTIONS.md` and `prisma/schema.prisma` before writing any code. They define folder structure, naming, component patterns, and the full data model.**

---

## TECH STACK (do not deviate)

| Layer          | Choice                           |
|----------------|----------------------------------|
| Framework      | Next.js 16+ (App Router)        |
| Language       | TypeScript (strict, no `any`)    |
| Database       | PostgreSQL via Prisma 7          |
| Auth           | Clerk (`@clerk/nextjs`)          |
| UI             | shadcn/ui + Tailwind CSS         |
| Icons          | `lucide-react`                   |
| Forms          | `react-hook-form` + `zod`        |
| Dates          | `date-fns`                       |
| Toasts         | `sonner`                         |
| Deployment     | Vercel                           |

---

## GLOBAL RULES (apply to ALL phases)

1. Every database query MUST include `householdId` in the WHERE clause. No exceptions.
2. All forms use `react-hook-form` with `zodResolver` and a zod schema.
3. All mutations happen in Server Actions (`"use server"` in `src/actions/`).
4. All data fetching happens in Server Components (page.tsx files).
5. Every mutation calls `logActivity()` to write to the `activity_log` table.
6. Every mutation calls `revalidatePath()` for affected routes.
7. Every page has a `loading.tsx` with skeleton placeholders.
8. Every list has an empty state with a call-to-action.
9. Mobile-first: design for 375px width first, then enhance for desktop.
10. Use `"use client"` only when the component needs interactivity (forms, click handlers, state).
11. No `any` types. Use Prisma generated types or define explicit interfaces in `src/types/index.ts`.
12. Import paths use `@/` alias (e.g., `@/lib/db`, `@/actions/chores`).

---

## PHASE 1: Foundation — Auth, Household, Navigation

### 1.1 Prisma Schema and Migration

Copy the full schema from `schema.prisma` into `prisma/schema.prisma`. This schema defines 10 models: User, Household, HouseholdMember, ChoreTemplate, ChoreInstance, Recipe, RecipeIngredient, MealPlan, GroceryItem, ActivityLog.

**Important Prisma 7 note:** The `datasource` block should NOT have a `url` property. The connection URL is configured in `prisma.config.ts`:

```typescript
// prisma.config.ts
import path from "node:path";
import { defineConfig } from "prisma/config";

export default defineConfig({
  earlyAccess: true,
  schema: path.join(__dirname, "prisma", "schema.prisma"),
  migrate: {
    async url() {
      return process.env.DATABASE_URL!;
    },
  },
});
```

Run:
```bash
npx prisma migrate dev --name init
npx prisma generate
```

Verify: all 10 tables exist in the database.

### 1.2 Prisma Client Singleton

Create `src/lib/db.ts`:

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const db = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
```

### 1.3 Clerk Auth Setup

**Middleware** — create `src/middleware.ts`:
- Use `clerkMiddleware()` from `@clerk/nextjs/server`
- Protect all routes except `/sign-in`, `/sign-up`, and static assets
- Public routes: `/sign-in(.*)`, `/sign-up(.*)`, `/api/webhooks(.*)`

**Auth pages:**
- `src/app/sign-in/[[...sign-in]]/page.tsx` — render `<SignIn />`
- `src/app/sign-up/[[...sign-up]]/page.tsx` — render `<SignUp />`
- Center both on the page with flexbox

**Root layout** (`src/app/layout.tsx`):
- Wrap everything in `<ClerkProvider>`
- Add `<Toaster />` from sonner
- Set up Geist font
- Include viewport meta for PWA

**Auth helpers** — create `src/lib/auth.ts`:

```typescript
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function getCurrentUser() {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  // Upsert: create DB user if they don't exist yet
  const user = await db.user.upsert({
    where: { clerkId: clerkUser.id },
    update: { name: clerkUser.firstName ?? "User", email: clerkUser.emailAddresses[0]?.emailAddress ?? "" },
    create: {
      clerkId: clerkUser.id,
      name: clerkUser.firstName ?? "User",
      email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
      avatarUrl: clerkUser.imageUrl,
    },
  });

  return user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}
```

**Household helpers** — create `src/lib/household.ts`:

```typescript
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function getHouseholdForUser() {
  const user = await requireAuth();

  const membership = await db.householdMember.findFirst({
    where: { userId: user.id },
    include: { household: true },
  });

  return { user, household: membership?.household ?? null };
}

export async function requireHousehold() {
  const { user, household } = await getHouseholdForUser();
  if (!household) redirect("/onboarding");
  return { user, household };
}
```

### 1.4 Household Creation and Join

**Server actions** — create `src/actions/household.ts`:

`createHousehold(name: string)`:
- Generate a random 8-character invite code (use `crypto.randomUUID().slice(0, 8)`)
- Create the Household record
- Create a HouseholdMember record with role OWNER
- Redirect to `/today`

`joinHousehold(inviteCode: string)`:
- Find household by inviteCode
- Check household has fewer than 2 members (this is a 2-person app)
- Create HouseholdMember record with role MEMBER
- Redirect to `/today`

**Onboarding page** — `src/app/onboarding/page.tsx`:
- Check if user already has a household → redirect to `/today`
- Two-tab or two-card layout:
  - "Create a household" — form with household name input
  - "Join a household" — form with invite code input
- Show validation errors inline
- After success, redirect to `/today`

### 1.5 App Shell and Navigation

**Dashboard layout** — `src/app/(dashboard)/layout.tsx`:
- Call `requireHousehold()` at the top (redirects to onboarding if needed)
- Pass household and user data to children via props or fetch in each page
- Render sidebar on `md:` and above, bottom nav below `md:`

**Sidebar** — `src/components/layout/sidebar.tsx`:
- Vertical nav with icon + label for each section
- Links: Today (Home icon), Chores (CheckSquare), Meals (UtensilsCrossed), Recipes (BookOpen), Groceries (ShoppingCart), History (Clock)
- Highlight active route using `usePathname()`
- Show household name and user avatar at the top
- Show invite code with a copy button at the bottom
- `"use client"` component

**Bottom nav** — `src/components/layout/bottom-nav.tsx`:
- Horizontal bar fixed to bottom, 5 tabs: Today, Chores, Meals, Recipes, Groceries
- History accessible from a menu or the Today page
- Icons only on mobile, icon + label on slightly wider screens
- `"use client"` component

**Root page** — `src/app/page.tsx`:
- Redirect to `/today`

**Placeholder pages** — create `page.tsx` for each route that returns a simple heading:
- `src/app/(dashboard)/today/page.tsx`
- `src/app/(dashboard)/chores/page.tsx`
- `src/app/(dashboard)/meals/page.tsx`
- `src/app/(dashboard)/recipes/page.tsx`
- `src/app/(dashboard)/groceries/page.tsx`
- `src/app/(dashboard)/history/page.tsx`

### 1.6 PWA Basics

Create `public/manifest.json`:
```json
{
  "name": "Chore Diary",
  "short_name": "Chore Diary",
  "start_url": "/today",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2E5090",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

Add `<link rel="manifest" href="/manifest.json" />` to root layout.

Generate placeholder icons (192x192 and 512x512 PNG) — a simple colored square with "CD" text is fine for now.

### Phase 1 Acceptance Criteria

- [ ] User can sign up and sign in via Clerk
- [ ] New user sees onboarding page to create or join a household
- [ ] Creating a household generates an invite code
- [ ] Second user can join via invite code
- [ ] Dashboard shell renders with working navigation (sidebar on desktop, bottom nav on mobile)
- [ ] All 6 placeholder pages are accessible
- [ ] Invite code is visible and copyable in sidebar
- [ ] App is installable as PWA on mobile
- [ ] Navigating to `/` redirects to `/today`
- [ ] Unauthenticated users are redirected to `/sign-in`
- [ ] Users without a household are redirected to `/onboarding`

---

## PHASE 2: Chore System

### 2.1 Zod Schemas

Create in `src/types/index.ts` (or a dedicated `src/types/chores.ts`):

```typescript
import { z } from "zod";

export const choreTemplateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  category: z.enum(["COOKING", "CLEANING", "LAUNDRY", "GROCERIES", "DISHES", "TRASH", "BATHROOM", "TIDYING", "HOUSEHOLD_ADMIN", "OTHER"]),
  assignedUserId: z.string().nullable(),
  recurrenceType: z.enum(["NONE", "DAILY", "EVERY_N_DAYS", "WEEKLY", "SPECIFIC_DAYS"]),
  recurrenceInterval: z.number().min(1).max(365).nullable(),
  daysOfWeek: z.array(z.number().min(0).max(6)).default([]),
  startDate: z.date(),
  notes: z.string().max(500).optional(),
});

export type ChoreTemplateFormValues = z.infer<typeof choreTemplateSchema>;
```

### 2.2 Server Actions — `src/actions/chores.ts`

`createChoreTemplate(data: ChoreTemplateFormValues)`:
- Validate with zod schema
- Create ChoreTemplate record
- Call `generateChoreInstances(templateId)` to create instances for next 14 days
- Call `logActivity()` with eventType CHORE_COMPLETED (no — use a CHORE_CREATED type if you add one, or skip logging creation)
- `revalidatePath("/chores")`

`updateChoreTemplate(templateId: string, data: Partial<ChoreTemplateFormValues>)`:
- Validate ownership (householdId check)
- Update template
- Delete future PENDING instances for this template
- Regenerate instances for next 14 days
- `revalidatePath("/chores")`

`toggleChoreTemplateActive(templateId: string)`:
- Toggle `isActive` field
- If deactivating: delete future PENDING instances
- If activating: regenerate instances
- `revalidatePath("/chores")`

`completeChore(choreInstanceId: string)`:
- Update instance: status → COMPLETED, completedAt → now, completedByUserId → current user
- Log activity: `"${user.name} completed ${chore.name}"`
- `revalidatePath("/chores")` and `revalidatePath("/today")`

`skipChore(choreInstanceId: string)`:
- Update instance: status → SKIPPED
- Log activity
- `revalidatePath("/chores")` and `revalidatePath("/today")`

`generateChoreInstances(templateId: string)`:
- Internal function (not exported as server action)
- Read the template's recurrence config
- Calculate due dates for the next 14 days
- Bulk create ChoreInstance records using `createMany`
- Update template's `nextDueDate`
- Handle each recurrence type:
  - NONE: create one instance on startDate
  - DAILY: one instance per day
  - EVERY_N_DAYS: one instance every N days
  - WEEKLY: one instance per week on the same weekday
  - SPECIFIC_DAYS: one instance per matching day of week

### 2.3 Chores Page — `src/app/(dashboard)/chores/page.tsx`

This is a Server Component. Fetch data here:

```typescript
const { user, household } = await requireHousehold();
const today = startOfDay(new Date());

const [dueToday, upcoming, overdue, recentlyCompleted] = await Promise.all([
  db.choreInstance.findMany({
    where: { householdId: household.id, dueDate: today, status: "PENDING" },
    include: { choreTemplate: true, completedBy: true },
    orderBy: { dueDate: "asc" },
  }),
  db.choreInstance.findMany({
    where: { householdId: household.id, dueDate: { gt: today }, status: "PENDING" },
    include: { choreTemplate: true },
    orderBy: { dueDate: "asc" },
    take: 20,
  }),
  db.choreInstance.findMany({
    where: { householdId: household.id, dueDate: { lt: today }, status: "PENDING" },
    include: { choreTemplate: true },
    orderBy: { dueDate: "asc" },
  }),
  db.choreInstance.findMany({
    where: { householdId: household.id, status: "COMPLETED" },
    include: { completedBy: true },
    orderBy: { completedAt: "desc" },
    take: 10,
  }),
]);
```

Pass data to client components for rendering.

### 2.4 UI Components

**ChoreCard** (`src/components/chores/chore-card.tsx`) — `"use client"`:
- Shows: name, category badge (color-coded), assigned person avatar or "Unassigned", due date (relative: "Today", "Tomorrow", "In 3 days", "2 days overdue")
- "Mark Done" button with optimistic UI (useOptimistic + useTransition)
- Overdue chores have a red accent/border
- Tap the card to open edit sheet/dialog

**ChoreForm** (`src/components/chores/chore-form.tsx`) — `"use client"`:
- Uses react-hook-form with choreTemplateSchema
- Fields: name (input), category (select), assigned to (select: me / partner / unassigned), recurrence type (select), recurrence interval (number, shown only for EVERY_N_DAYS), days of week (checkbox group, shown only for SPECIFIC_DAYS), start date (date picker), notes (textarea)
- Submit calls the createChoreTemplate or updateChoreTemplate server action
- Toast on success/error

**ChoreFilters** (`src/components/chores/chore-filters.tsx`) — `"use client"`:
- Filter bar with buttons/tabs: All, Mine, Partner's, Overdue
- Category filter dropdown
- Filters update URL search params (useSearchParams) so the page re-renders with filtered data
- Alternatively: client-side filtering of the data already fetched

**Add Chore button:**
- Floating action button on mobile (bottom-right, above bottom nav)
- Regular button in page header on desktop
- Opens ChoreForm in a shadcn Dialog

### 2.5 Household Members Fetching

Create a helper to get the partner user for assignment dropdowns:

```typescript
// src/lib/household.ts — add this function
export async function getHouseholdMembers(householdId: string) {
  return db.householdMember.findMany({
    where: { householdId },
    include: { user: true },
  });
}
```

### Phase 2 Acceptance Criteria

- [ ] Can create a one-off chore with a due date
- [ ] Can create recurring chores (daily, every N days, weekly, specific days)
- [ ] Recurring chores auto-generate instances for 14 days
- [ ] Chores page shows sections: Due Today, Upcoming, Overdue, Recently Completed
- [ ] One-tap "Mark Done" updates instantly (optimistic UI)
- [ ] Completed chores show who completed them and when
- [ ] Can assign chores to self, partner, or unassigned
- [ ] Can filter by: all, mine, partner's, overdue, category
- [ ] Can edit a chore template (future instances regenerate)
- [ ] Can deactivate/reactivate a chore template
- [ ] Activity log records every completion
- [ ] Overdue chores are visually distinct (red accent)
- [ ] Layout works on mobile and desktop

---

## PHASE 3: Recipes

### 3.1 Zod Schema

```typescript
export const ingredientSchema = z.object({
  ingredientName: z.string().min(1, "Name is required"),
  quantity: z.number().positive("Must be positive"),
  unit: z.string().nullable(),
  isOptional: z.boolean().default(false),
  sortOrder: z.number().default(0),
});

export const recipeSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(1000).optional(),
  defaultServings: z.number().min(1).max(20).default(2),
  mealType: z.enum(["LUNCH", "DINNER"]).nullable(),
  prepTimeMinutes: z.number().min(0).max(600).nullable(),
  instructions: z.string().max(5000).optional(),
  tags: z.array(z.string()).default([]),
  ingredients: z.array(ingredientSchema).min(1, "At least one ingredient is required"),
});
```

### 3.2 Server Actions — `src/actions/recipes.ts`

`createRecipe(data: RecipeFormValues)`:
- Create Recipe record
- Create RecipeIngredient records with `normalizedName` = lowercase, trimmed, singularized version of ingredientName
- Log activity
- `revalidatePath("/recipes")`

`updateRecipe(recipeId: string, data: RecipeFormValues)`:
- Validate ownership
- Update recipe fields
- Delete existing ingredients, create new ones (simpler than diffing for MVP)
- `revalidatePath("/recipes")` and `revalidatePath("/meals")`

`deleteRecipe(recipeId: string)`:
- Check no future meal plans reference this recipe (warn user if so)
- Delete recipe (cascade deletes ingredients)
- Log activity
- `revalidatePath("/recipes")`

**Ingredient normalization function:**
```typescript
function normalizeIngredientName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/ies$/, "y")     // berries → berry
    .replace(/ves$/, "f")     // halves → half
    .replace(/es$/, "")       // tomatoes → tomato (careful with edge cases)
    .replace(/s$/, "");       // carrots → carrot
}
```
This is intentionally simple. Perfect singularization is not needed for MVP — the autocomplete will handle most cases.

### 3.3 Ingredient Seed Data

Create `prisma/seed.ts` with a list of ~150 common ingredients for autocomplete:

Categories to cover: vegetables (tomato, onion, garlic, potato, carrot, pepper, broccoli, spinach, zucchini, mushroom, lettuce, cucumber, eggplant, celery, corn, peas, green beans, cauliflower, cabbage, kale), fruits (apple, banana, lemon, lime, orange, avocado, strawberry, blueberry, mango, pineapple), proteins (chicken breast, chicken thigh, ground beef, ground turkey, salmon, shrimp, tofu, eggs, bacon, sausage), dairy (milk, butter, cream, yogurt, cheddar cheese, mozzarella, parmesan, cream cheese, feta, sour cream), pantry (olive oil, vegetable oil, salt, black pepper, flour, sugar, brown sugar, rice, pasta, bread, soy sauce, vinegar, honey, mustard, ketchup, tomato sauce, canned tomatoes, coconut milk, chicken broth, dried oregano, dried basil, cumin, paprika, chili powder, cinnamon, garlic powder, onion powder, baking powder, baking soda, cornstarch, peanut butter), and other common items.

Store as a JSON file: `prisma/data/ingredients.json` — array of strings.

Create a server action or utility `getIngredientSuggestions(query: string, householdId: string)`:
- Search the seed list + previously used ingredients in this household
- Return top 10 matches
- Use case-insensitive prefix matching

### 3.4 Recipes Page — `src/app/(dashboard)/recipes/page.tsx`

Server Component. Fetch all recipes for the household:

```typescript
const recipes = await db.recipe.findMany({
  where: { householdId: household.id },
  include: { ingredients: true, createdBy: true },
  orderBy: { createdAt: "desc" },
});
```

Support URL search params for filtering: `?search=lentil&tags=vegetarian,quick`

### 3.5 UI Components

**RecipeCard** (`src/components/recipes/recipe-card.tsx`):
- Card showing: name, tags as small badges, prep time, default servings
- Tap to navigate to recipe detail page

**RecipeForm** (`src/components/recipes/recipe-form.tsx`) — `"use client"`:
- Fields: name, description (textarea), default servings (number), meal type (select: Lunch / Dinner / Both), prep time (number + "minutes" label), instructions (textarea), tags (multi-select from predefined list: Quick, Healthy, Vegetarian, Comfort Food, Meal Prep, Cheap, Dinner, Lunch — also allow custom tags)
- Dynamic ingredient list (see IngredientInput below)
- "Add Ingredient" button adds a new row
- Submit creates/updates recipe

**IngredientInput** (`src/components/recipes/ingredient-input.tsx`) — `"use client"`:
- Each row: quantity (number input, narrow), unit (select: g, kg, ml, l, tsp, tbsp, cup, piece, can, bunch, clove, slice, or null/"to taste"), ingredient name (text input with autocomplete dropdown)
- Autocomplete calls `getIngredientSuggestions` with debounce (300ms)
- "Remove" button (trash icon) on each row
- Drag to reorder (optional for MVP — sortOrder field handles it, but manual reorder is fine)

**Recipe Detail Page** (`src/app/(dashboard)/recipes/[id]/page.tsx`):
- Server Component
- Show full recipe: name, description, servings, prep time, ingredient list (quantity + unit + name), instructions, tags
- Edit button → navigates to edit form or opens modal
- Delete button with confirmation dialog

### Phase 3 Acceptance Criteria

- [ ] Can create a recipe with name, servings, ingredients, instructions, and tags
- [ ] Ingredients are structured (quantity + unit + name), not free text
- [ ] Ingredient name field has autocomplete from seed list + household history
- [ ] Recipe list page with search and tag filtering
- [ ] Recipe detail page shows all fields
- [ ] Can edit a recipe (ingredients fully replaced)
- [ ] Can delete a recipe (with confirmation)
- [ ] Activity log records recipe creation
- [ ] Mobile-friendly forms with appropriate input types (number keyboard for quantities)

---

## PHASE 4: Meal Planner

### 4.1 Zod Schema

```typescript
export const mealPlanSchema = z.object({
  date: z.date(),
  mealSlot: z.enum(["LUNCH", "DINNER"]),
  recipeId: z.string().nullable(),
  customMealName: z.string().max(200).nullable(),
  assignedUserId: z.string().nullable(),
  servings: z.number().min(1).max(20).default(2),
  notes: z.string().max(500).optional(),
}).refine(data => data.recipeId || data.customMealName, {
  message: "Either select a recipe or enter a custom meal name",
});
```

### 4.2 Server Actions — `src/actions/meals.ts`

`planMeal(data: MealPlanFormValues)`:
- Upsert meal plan (unique on householdId + date + mealSlot)
- Log activity
- `revalidatePath("/meals")` and `revalidatePath("/today")` and `revalidatePath("/groceries")`

`markMealCooked(mealPlanId: string)`:
- Update: status → COOKED, cookedAt → now, cookedByUserId → current user
- Log activity: `"${user.name} cooked ${meal.recipe?.name ?? meal.customMealName}"`
- `revalidatePath` for meals, today, history

`removeMeal(mealPlanId: string)`:
- Delete the meal plan record
- `revalidatePath` for meals, today, groceries

`duplicateMeal(mealPlanId: string, targetDate: Date, targetSlot: MealSlot)`:
- Read source meal
- Create new meal plan with same recipe/name/servings for target date+slot
- `revalidatePath("/meals")`

### 4.3 Meal Planner Page — `src/app/(dashboard)/meals/page.tsx`

Server Component. Determine the current week (Monday to Sunday):

```typescript
import { startOfWeek, endOfWeek, eachDayOfInterval, format } from "date-fns";

const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

const meals = await db.mealPlan.findMany({
  where: {
    householdId: household.id,
    date: { gte: weekStart, lte: weekEnd },
  },
  include: { recipe: true, assignedTo: true, cookedBy: true },
});
```

Support week navigation via URL search params: `?week=2026-04-13` (ISO date of Monday).

### 4.4 UI Components

**MealCalendar** (`src/components/meals/meal-calendar.tsx`) — `"use client"`:
- 7-day grid layout
- Desktop: 7 columns (Mon–Sun), 2 rows (Lunch, Dinner)
- Mobile: vertical list of days, each day shows lunch + dinner slots stacked
- Week navigation: "← Previous Week" and "Next Week →" buttons
- Current day highlighted

**MealSlot** (`src/components/meals/meal-slot.tsx`) — `"use client"`:
- Empty slot: shows "+" button, tap opens MealFormModal
- Filled slot: shows recipe name (or custom name), cook avatar, servings, status badge (planned/cooked/skipped)
- Actions on filled slot: mark cooked (if planned), edit, remove, duplicate to another day
- Cooked meals have a green checkmark overlay
- Use a context menu (right-click desktop, long-press mobile) or a small dropdown for secondary actions

**MealFormModal** (`src/components/meals/meal-form-modal.tsx`) — `"use client"`:
- shadcn Dialog or Sheet (Sheet works better on mobile)
- Two modes: "Choose recipe" (searchable list of household recipes) or "Custom meal" (text input)
- When recipe is selected: show recipe name, auto-fill servings from recipe default
- Fields: servings (number), assigned cook (select: me / partner), notes (textarea)
- Submit calls planMeal server action

### Phase 4 Acceptance Criteria

- [ ] Weekly calendar shows 7 days with lunch and dinner slots
- [ ] Can navigate between weeks
- [ ] Can add a meal by selecting a recipe or entering a custom name
- [ ] Can assign a cook to each meal
- [ ] Can adjust servings per meal
- [ ] Can mark a meal as cooked (one tap from the calendar)
- [ ] Cooked meals are visually distinct
- [ ] Can remove a planned meal
- [ ] Can duplicate a meal to another day/slot
- [ ] Activity log records meal planning and cooking
- [ ] Current day is highlighted
- [ ] Mobile layout shows days as a vertical list

---

## PHASE 5: Grocery List

### 5.1 Server Actions — `src/actions/groceries.ts`

`generateGroceryList(householdId: string, startDate: Date, endDate: Date)`:
- This is the CORE feature. Get it right.
- Query all meal plans in the date range with status PLANNED
- Join their recipes and recipe_ingredients
- For each ingredient: adjust quantity by (meal servings / recipe default servings)
- Group by normalizedName + compatible unit
- Sum quantities within each group
- Return the aggregated list
- This should be computed dynamically (called on page load), NOT permanently stored

```typescript
// Pseudocode for aggregation:
const meals = await db.mealPlan.findMany({
  where: {
    householdId,
    date: { gte: startDate, lte: endDate },
    status: "PLANNED",
    recipeId: { not: null },
  },
  include: { recipe: { include: { ingredients: true } } },
});

const aggregated = new Map<string, AggregatedIngredient>();

for (const meal of meals) {
  const ratio = meal.servings / (meal.recipe?.defaultServings ?? 2);
  for (const ing of meal.recipe?.ingredients ?? []) {
    const key = `${ing.normalizedName}__${ing.unit ?? "piece"}`;
    if (aggregated.has(key)) {
      aggregated.get(key)!.quantity += ing.quantity * ratio;
    } else {
      aggregated.set(key, {
        name: ing.ingredientName,
        normalizedName: ing.normalizedName,
        quantity: ing.quantity * ratio,
        unit: ing.unit,
        category: inferGroceryCategory(ing.normalizedName), // simple mapping function
        sources: [],
      });
    }
    aggregated.get(key)!.sources.push(meal.recipe!.name);
  }
}
```

`addManualGroceryItem(data)`:
- Create GroceryItem with sourceType MANUAL
- `revalidatePath("/groceries")`

`toggleGroceryItemChecked(itemId: string)`:
- Toggle `checked` boolean
- `revalidatePath("/groceries")`

`markGroceryBought(itemId: string)`:
- Update status to BOUGHT
- Log activity
- `revalidatePath("/groceries")` and `revalidatePath("/today")`

`clearBoughtItems(householdId: string)`:
- Update all BOUGHT items to ARCHIVED
- `revalidatePath("/groceries")`

### 5.2 Grocery Category Inference

Simple mapping function — does not need to be perfect:

```typescript
function inferGroceryCategory(normalizedName: string): GroceryCategory {
  const categories: Record<string, string[]> = {
    VEGETABLES: ["tomato", "onion", "garlic", "carrot", "potato", "pepper", "broccoli", "spinach", ...],
    FRUIT: ["apple", "banana", "lemon", "orange", "avocado", "strawberry", ...],
    DAIRY: ["milk", "butter", "cream", "cheese", "yogurt", ...],
    MEAT_FISH: ["chicken", "beef", "pork", "salmon", "shrimp", "turkey", ...],
    PANTRY: ["oil", "flour", "sugar", "rice", "pasta", "salt", "pepper", "soy sauce", ...],
    FROZEN: ["frozen", "ice cream", ...],
  };
  // Check if normalizedName contains any keyword from each category
  // Default to OTHER
}
```

### 5.3 Groceries Page — `src/app/(dashboard)/groceries/page.tsx`

Server Component. Fetch:
1. Auto-generated list from `generateGroceryList()` for the next 7 days
2. Manual grocery items with status NEEDED
3. Recently bought items

### 5.4 UI Components

**GroceryList** (`src/components/groceries/grocery-list.tsx`) — `"use client"`:
- Sections: "From Meal Plan" (grouped by category), "Manual Items", "Bought"
- Each section collapsible
- Date range selector at the top (default: next 7 days)

**GroceryItem** (`src/components/groceries/grocery-item.tsx`) — `"use client"`:
- Checkbox to mark checked/bought
- Shows: name, quantity + unit, category badge, source recipe(s)
- Checked items get strikethrough styling
- Swipe to delete on mobile (or delete button)

**AddGroceryForm** (`src/components/groceries/add-grocery-form.tsx`) — `"use client"`:
- Quick inline form at the top of the manual items section
- Fields: name (text), quantity (number, default 1), unit (select), category (select)
- Submit on Enter key for fast entry

### Phase 5 Acceptance Criteria

- [ ] Grocery list auto-generates from planned meals for the selected date range
- [ ] Ingredient quantities are adjusted by servings ratio
- [ ] Duplicate ingredients are merged with summed quantities
- [ ] Items are grouped by category
- [ ] Can add manual grocery items (household supplies)
- [ ] Can check/uncheck individual items
- [ ] Can mark items as bought
- [ ] "Clear bought" archives all bought items
- [ ] Source recipes are shown for auto-generated items
- [ ] Date range is adjustable (default: next 7 days)
- [ ] Activity log records grocery-related actions
- [ ] Mobile-friendly with easy tap targets for checkboxes

---

## PHASE 6: Today Page and History

### 6.1 Today Page — `src/app/(dashboard)/today/page.tsx`

This is the **most important page**. It answers: "What do we need to do today?"

Server Component. Fetch all data in parallel:

```typescript
const today = startOfDay(new Date());

const [todayMeals, dueChores, overdueChores, groceryItems] = await Promise.all([
  db.mealPlan.findMany({
    where: { householdId: household.id, date: today },
    include: { recipe: true, assignedTo: true, cookedBy: true },
  }),
  db.choreInstance.findMany({
    where: { householdId: household.id, dueDate: today, status: "PENDING" },
    include: { choreTemplate: true },
  }),
  db.choreInstance.findMany({
    where: { householdId: household.id, dueDate: { lt: today }, status: "PENDING" },
    include: { choreTemplate: true },
    orderBy: { dueDate: "asc" },
  }),
  db.groceryItem.findMany({
    where: { householdId: household.id, status: "NEEDED", checked: false },
    take: 10,
  }),
]);
```

### 6.2 Today Page Layout

Sections (top to bottom):
1. **Greeting**: "Good morning, {name}" (time-appropriate greeting)
2. **Today's Meals**: Lunch and Dinner cards. Each shows recipe name, assigned cook, "Mark Cooked" button. If empty, show "Plan lunch/dinner" link.
3. **Chores Due Today**: List of chore cards with one-tap "Done" buttons. If empty: "Nothing due today!"
4. **Overdue Chores**: Red-accented section. Only shown if there are overdue items.
5. **Grocery Snapshot**: Top 5-10 unchecked grocery items with checkboxes. "See full list →" link.

**All actions are completable from this page** — no navigation required for the most common daily tasks.

### 6.3 History Page — `src/app/(dashboard)/history/page.tsx`

Server Component. Fetch activity log:

```typescript
const activities = await db.activityLog.findMany({
  where: { householdId: household.id },
  include: { user: true },
  orderBy: { createdAt: "desc" },
  take: 50,
});
```

### 6.4 UI Components

**ActivityFeed** (`src/components/history/activity-feed.tsx`):
- Chronological list with relative timestamps ("2 hours ago", "Yesterday", "Apr 10")
- Each entry: user avatar, message, timestamp
- Icon per event type (checkmark for chore, utensils for cooking, cart for grocery)
- Filter tabs: All, Chores, Meals, Groceries
- "Load more" button for pagination (offset-based is fine for MVP)

**StatsCards** (`src/components/history/stats-cards.tsx`):
- This week's stats in a grid of cards:
  - "Chores Done": count per person, side by side
  - "Meals Cooked": count per person
  - "Grocery Items Bought": total count
- Use a simple query with `groupBy`:

```typescript
const choreStats = await db.choreInstance.groupBy({
  by: ["completedByUserId"],
  where: {
    householdId: household.id,
    status: "COMPLETED",
    completedAt: { gte: startOfWeek(new Date(), { weekStartsOn: 1 }) },
  },
  _count: true,
});
```

- Display as two columns (Person A | Person B) with counts
- Neutral tone — no "winner" language, no gamification

### Phase 6 Acceptance Criteria

- [ ] Today page shows: meals, due chores, overdue chores, grocery snapshot
- [ ] Can complete chores directly from Today page
- [ ] Can mark meals cooked directly from Today page
- [ ] Can check grocery items directly from Today page
- [ ] Greeting is time-appropriate
- [ ] History page shows chronological activity feed
- [ ] Activity feed can be filtered by type
- [ ] "Load more" pagination works
- [ ] Stats show weekly chore and meal counts per person
- [ ] Stats use neutral, non-accusatory language
- [ ] Today page is the default landing page (/ redirects here)
- [ ] Mobile layout is polished — this is the most-used screen

---

## PHASE 7: Polish, Testing, and Launch

### 7.1 Loading States

Create `loading.tsx` for every route:
- `src/app/(dashboard)/today/loading.tsx`
- `src/app/(dashboard)/chores/loading.tsx`
- `src/app/(dashboard)/meals/loading.tsx`
- `src/app/(dashboard)/recipes/loading.tsx`
- `src/app/(dashboard)/groceries/loading.tsx`
- `src/app/(dashboard)/history/loading.tsx`

Each should use shadcn `Skeleton` components matching the page layout.

### 7.2 Error Handling

Create `error.tsx` for the dashboard layout:
- `src/app/(dashboard)/error.tsx` — catches errors in any dashboard page
- `"use client"` component
- Show friendly error message with "Try Again" button
- Log error details to console

### 7.3 Empty States

Verify every list/page has an empty state:
- Chores: "No chores yet. Add your first chore to get started."
- Recipes: "No recipes saved. Create your first recipe."
- Meals: "No meals planned this week. Start planning!"
- Groceries: "Your grocery list is empty. Plan some meals or add items manually."
- History: "No activity yet. Start using the app to see your history."

### 7.4 Toast Notifications

Verify all server actions trigger appropriate toasts:
- Success: "Chore completed", "Meal marked as cooked", "Recipe saved", "Item added to grocery list"
- Error: "Something went wrong. Please try again."

### 7.5 Responsive Audit

Test on these screen sizes:
- 375px (iPhone SE)
- 390px (iPhone 14)
- 768px (iPad)
- 1024px+ (desktop)

Check:
- Bottom nav visible only on mobile, sidebar only on desktop
- Forms are usable on mobile (no tiny inputs, appropriate keyboard types)
- Calendar grid adapts to mobile (vertical list) vs desktop (horizontal grid)
- Tap targets are at least 44x44px
- No horizontal scrolling anywhere

### 7.6 Optimistic UI Audit

Verify these actions update the UI instantly (before server response):
- Mark chore as done
- Mark meal as cooked
- Check/uncheck grocery item
- Skip chore

### 7.7 Security Audit

Verify:
- All queries include `householdId` in WHERE clause
- Users cannot access another household's data (test with 2 households)
- Server actions validate that the current user belongs to the household
- No sensitive data in client-side code
- `.env.local` is in `.gitignore`

### 7.8 Performance

Add database indexes (already defined in schema, verify they exist):
- `chore_instances`: householdId + dueDate, householdId + status
- `meal_plans`: householdId + date
- `activity_log`: householdId + createdAt
- `grocery_items`: householdId + status
- `recipes`: householdId

### 7.9 Seed Script

Finalize `prisma/seed.ts`:
- Create default ingredient seed data (JSON file)
- Optionally: create 5 sample recipes for new households (lentil curry, pasta carbonara, Greek salad, stir fry, omelette)

Add to `package.json`:
```json
"prisma": { "seed": "npx tsx prisma/seed.ts" }
```

### 7.10 Deployment

1. Push to GitHub
2. Connect repo to Vercel
3. Add all environment variables in Vercel dashboard:
   - `DATABASE_URL`
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - All `NEXT_PUBLIC_CLERK_*_URL` vars
4. Deploy
5. Configure Clerk production keys (switch from dev to production in Clerk dashboard)
6. Test: sign up, create household, invite partner, complete full workflow

### Phase 7 Acceptance Criteria

- [ ] Every page has loading skeletons
- [ ] Error boundaries catch and display errors gracefully
- [ ] All lists have meaningful empty states
- [ ] Toast notifications for all user actions
- [ ] App works on iPhone SE, Android, iPad, and desktop
- [ ] All completion actions use optimistic UI
- [ ] Security: cross-household data access is impossible
- [ ] Database indexes are applied
- [ ] Seed script runs successfully
- [ ] App is deployed to Vercel and functional in production
- [ ] Full workflow tested: sign up → create household → add chore → add recipe → plan meal → generate groceries → complete chore → mark cooked → check grocery items → view history

---

## APPENDIX: File Checklist

When all phases are complete, the project should contain these files (at minimum):

```
src/
├── middleware.ts
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── sign-in/[[...sign-in]]/page.tsx
│   ├── sign-up/[[...sign-up]]/page.tsx
│   ├── onboarding/page.tsx
│   └── (dashboard)/
│       ├── layout.tsx
│       ├── error.tsx
│       ├── today/page.tsx, loading.tsx
│       ├── chores/page.tsx, loading.tsx, [id]/page.tsx
│       ├── meals/page.tsx, loading.tsx
│       ├── recipes/page.tsx, loading.tsx, new/page.tsx, [id]/page.tsx
│       ├── groceries/page.tsx, loading.tsx
│       └── history/page.tsx, loading.tsx
├── components/
│   ├── ui/ (shadcn — auto-generated)
│   ├── layout/sidebar.tsx, bottom-nav.tsx, household-guard.tsx
│   ├── chores/chore-card.tsx, chore-form.tsx, chore-filters.tsx
│   ├── meals/meal-calendar.tsx, meal-slot.tsx, meal-form-modal.tsx
│   ├── recipes/recipe-card.tsx, recipe-form.tsx, ingredient-input.tsx
│   ├── groceries/grocery-list.tsx, grocery-item.tsx, add-grocery-form.tsx
│   └── history/activity-feed.tsx, stats-cards.tsx
├── actions/chores.ts, meals.ts, recipes.ts, groceries.ts, household.ts, activity.ts
├── lib/db.ts, auth.ts, household.ts, utils.ts
└── types/index.ts
```
