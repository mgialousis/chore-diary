import { parseISO, startOfWeek, addDays, eachDayOfInterval } from "date-fns";
import { db } from "@/lib/db";
import { toDateOnly } from "@/lib/date";
import { requireHousehold } from "@/lib/household";
import { MealCalendar } from "@/components/meals/meal-calendar";

export default async function MealsPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { household } = await requireHousehold();
  const params = await searchParams;

  const weekStart = params.week
    ? startOfWeek(parseISO(params.week), { weekStartsOn: 1 })
    : startOfWeek(new Date(), { weekStartsOn: 1 });

  const weekEnd = addDays(weekStart, 6);
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const weekStartDate = toDateOnly(weekStart);
  const weekEndDate = toDateOnly(weekEnd);

  const [meals, recipes, members] = await Promise.all([
    db.mealPlan.findMany({
      where: {
        householdId: household.id,
        date: { gte: weekStartDate, lte: weekEndDate },
      },
      include: {
        recipe: true,
        assignedTo: true,
        cookedBy: true,
      },
      orderBy: [{ date: "asc" }, { mealSlot: "asc" }],
    }),
    db.recipe.findMany({
      where: { householdId: household.id },
      orderBy: { name: "asc" },
    }),
    db.householdMember.findMany({
      where: { householdId: household.id },
      include: { user: true },
    }),
  ]);

  return (
    <div className="space-y-5 p-4 md:p-6">
      <div className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Weekly kitchen rhythm
        </p>
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight">Meal Planner</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Plan lunches and dinners for the week, assign cooks, and keep the grocery list in sync.
            </p>
          </div>
        </div>
      </div>
      {meals.length === 0 && (
        <div className="rounded-2xl border border-dashed bg-muted/20 p-6 text-center text-muted-foreground">
          <p>No meals planned this week. Start planning!</p>
        </div>
      )}
      <MealCalendar
        days={days}
        meals={meals}
        weekStart={weekStart}
        recipes={recipes}
        members={members}
      />
    </div>
  );
}
