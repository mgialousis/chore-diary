import { db } from "@/lib/db";
import { toDateOnly } from "@/lib/date";
import { requireHousehold } from "@/lib/household";
import { TodayChores } from "@/components/today/today-chores";
import { TodayGroceries } from "@/components/today/today-groceries";
import { TodayMeals } from "@/components/today/today-meals";

function getGreeting(name: string) {
  const hour = new Date().getHours();

  if (hour < 12) return `Good morning, ${name}`;
  if (hour < 18) return `Good afternoon, ${name}`;
  return `Good evening, ${name}`;
}

function getErrorDetails(error: unknown) {
  if (!(error instanceof Error)) {
    return { error };
  }

  const details: Record<string, unknown> = {
    name: error.name,
    message: error.message,
  };

  if ("code" in error) details.code = (error as { code?: string }).code;
  if ("meta" in error) details.meta = (error as { meta?: unknown }).meta;
  if ("clientVersion" in error) {
    details.clientVersion = (error as { clientVersion?: string }).clientVersion;
  }

  return details;
}

async function runTodayQuery<T>(label: string, query: () => Promise<T>) {
  try {
    return await query();
  } catch (error) {
    console.error(`[today] ${label} failed`, getErrorDetails(error));
    throw error;
  }
}

export default async function TodayPage() {
  const { user, household } = await requireHousehold();
  const today = toDateOnly(new Date());
  const [todayMeals, dueChores, overdueChores, groceryItems] = await Promise.all([
    runTodayQuery("todayMeals", () =>
      db.mealPlan.findMany({
        where: { householdId: household.id, date: today },
        include: { recipe: true, assignedTo: true, cookedBy: true },
        orderBy: { mealSlot: "asc" },
      })),
    runTodayQuery("dueChores", () =>
      db.choreInstance.findMany({
        where: { householdId: household.id, dueDate: today, status: "PENDING" },
        include: { choreTemplate: true, completedBy: true },
        orderBy: { dueDate: "asc" },
      })),
    runTodayQuery("overdueChores", () =>
      db.choreInstance.findMany({
        where: { householdId: household.id, dueDate: { lt: today }, status: "PENDING" },
        include: { choreTemplate: true, completedBy: true },
        orderBy: { dueDate: "asc" },
      })),
    runTodayQuery("groceryItems", () =>
      db.groceryItem.findMany({
        where: { householdId: household.id, status: "NEEDED", checked: false },
        orderBy: [{ category: "asc" }, { createdAt: "desc" }],
        take: 10,
      })),
  ]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="rounded-3xl border bg-gradient-to-r from-amber-50 via-background to-sky-50 p-6 shadow-sm">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Daily overview
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">{getGreeting(user.name)}</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Here&apos;s what needs attention today across meals, chores, and groceries.
          </p>
        </div>
      </div>

      <TodayMeals meals={todayMeals} />
      <TodayChores dueChores={dueChores} overdueChores={overdueChores} />
      <TodayGroceries items={groceryItems} />
    </div>
  );
}
