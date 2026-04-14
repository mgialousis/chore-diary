import { startOfWeek } from "date-fns";
import type { EventType } from "@prisma/client";
import { db } from "@/lib/db";
import { requireHousehold } from "@/lib/household";
import { ActivityFeed } from "@/components/history/activity-feed";
import { StatsCards } from "@/components/history/stats-cards";

const FILTERS: Record<string, EventType[] | undefined> = {
  all: undefined,
  chores: ["CHORE_COMPLETED", "CHORE_SKIPPED"],
  meals: ["MEAL_PLANNED", "MEAL_COOKED"],
  groceries: ["GROCERY_ADDED", "GROCERY_BOUGHT"],
};

const PAGE_SIZE = 20;

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; offset?: string }>;
}) {
  const { household } = await requireHousehold();
  const params = await searchParams;
  const filter = params.type && params.type in FILTERS ? params.type : "all";
  const offset = Number(params.offset ?? "0") || 0;
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const eventTypes = FILTERS[filter];

  const [activities, householdMembers, choreCounts, mealCounts, groceryBoughtCount] = await Promise.all([
    db.activityLog.findMany({
      where: {
        householdId: household.id,
        ...(eventTypes ? { eventType: { in: eventTypes } } : {}),
      },
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE + 1,
      skip: offset,
    }),
    db.householdMember.findMany({
      where: { householdId: household.id },
      include: { user: true },
    }),
    db.choreInstance.groupBy({
      by: ["completedByUserId"],
      where: {
        householdId: household.id,
        status: "COMPLETED",
        completedAt: { gte: weekStart },
      },
      _count: true,
    }),
    db.mealPlan.groupBy({
      by: ["cookedByUserId"],
      where: {
        householdId: household.id,
        status: "COOKED",
        cookedAt: { gte: weekStart },
      },
      _count: true,
    }),
    db.groceryItem.count({
      where: {
        householdId: household.id,
        status: "BOUGHT",
        updatedAt: { gte: weekStart },
      },
    }),
  ]);

  const visibleActivities = activities.slice(0, PAGE_SIZE);
  const nextOffset = activities.length > PAGE_SIZE ? offset + PAGE_SIZE : null;

  const countByKey = <T extends { _count: number; completedByUserId?: string | null; cookedByUserId?: string | null }>(
    key: "completedByUserId" | "cookedByUserId",
    rows: T[],
  ) => {
    const counts = new Map(
      rows
        .map((row) => [row[key], row._count] as const)
        .filter((entry): entry is [string, number] => typeof entry[0] === "string"),
    );

    return householdMembers.map((member) => ({
      name: member.user.name,
      count: counts.get(member.user.id) ?? 0,
    }));
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">History</h1>
        <p className="text-sm text-muted-foreground">
          Recent household activity and this week&apos;s counts.
        </p>
      </div>

      <StatsCards
        choreStats={countByKey("completedByUserId", choreCounts)}
        mealStats={countByKey("cookedByUserId", mealCounts)}
        groceryBoughtCount={groceryBoughtCount}
      />

      <ActivityFeed
        activities={visibleActivities}
        filter={filter}
        nextOffset={nextOffset}
      />
    </div>
  );
}
