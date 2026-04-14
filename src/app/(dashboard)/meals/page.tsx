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
    <div className="p-4 md:p-6 space-y-4">
      <h1 className="text-2xl font-bold">Meal Planner</h1>
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
