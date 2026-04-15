import { endOfMonth, parseISO, startOfMonth } from "date-fns";
import { db } from "@/lib/db";
import { requireHousehold } from "@/lib/household";
import { getHouseholdMembers } from "@/lib/household";
import { ChoreList } from "@/components/chores/chore-list";
import { toDateOnly } from "@/lib/date";

export default async function ChoresPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; month?: string }>;
}) {
  const { user, household } = await requireHousehold();
  const params = await searchParams;
  const today = toDateOnly(new Date());
  const view = params.view === "calendar" ? "calendar" : "list";
  const selectedMonth = params.month ? parseISO(params.month) : new Date();
  const calendarMonthStart = startOfMonth(selectedMonth);
  const calendarMonthEnd = endOfMonth(selectedMonth);

  const [dueToday, upcoming, overdue, recentlyCompleted, inactiveTemplates, calendarChores, members] =
    await Promise.all([
      db.choreInstance.findMany({
        where: {
          householdId: household.id,
          dueDate: today,
          status: "PENDING",
        },
        include: { choreTemplate: true, completedBy: true },
        orderBy: { dueDate: "asc" },
      }),
      db.choreInstance.findMany({
        where: {
          householdId: household.id,
          dueDate: { gt: today },
          status: "PENDING",
        },
        include: { choreTemplate: true, completedBy: true },
        orderBy: { dueDate: "asc" },
        take: 20,
      }),
      db.choreInstance.findMany({
        where: {
          householdId: household.id,
          dueDate: { lt: today },
          status: "PENDING",
        },
        include: { choreTemplate: true, completedBy: true },
        orderBy: { dueDate: "asc" },
      }),
      db.choreInstance.findMany({
        where: {
          householdId: household.id,
          status: { in: ["COMPLETED", "SKIPPED"] },
        },
        include: { choreTemplate: true, completedBy: true },
        orderBy: [{ completedAt: "desc" }, { createdAt: "desc" }],
        take: 10,
      }),
      db.choreTemplate.findMany({
        where: {
          householdId: household.id,
          isActive: false,
        },
        include: { assignedUser: true },
        orderBy: { updatedAt: "desc" },
      }),
      db.choreInstance.findMany({
        where: {
          householdId: household.id,
          status: "PENDING",
          dueDate: {
            gte: toDateOnly(calendarMonthStart),
            lte: toDateOnly(calendarMonthEnd),
          },
        },
        include: { choreTemplate: true, completedBy: true },
        orderBy: [{ dueDate: "asc" }, { name: "asc" }],
      }),
      getHouseholdMembers(household.id),
    ]);

  return (
    <ChoreList
      dueToday={dueToday}
      upcoming={upcoming}
      overdue={overdue}
      recentlyCompleted={recentlyCompleted}
      inactiveTemplates={inactiveTemplates}
      calendarChores={calendarChores}
      view={view}
      calendarMonth={calendarMonthStart}
      members={members}
      currentUserId={user.id}
    />
  );
}
