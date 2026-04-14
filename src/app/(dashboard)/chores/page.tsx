import { db } from "@/lib/db";
import { requireHousehold } from "@/lib/household";
import { getHouseholdMembers } from "@/lib/household";
import { startOfDay } from "date-fns";
import { ChoreList } from "@/components/chores/chore-list";

export default async function ChoresPage() {
  const { user, household } = await requireHousehold();
  const today = startOfDay(new Date());

  const [dueToday, upcoming, overdue, recentlyCompleted, members] =
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
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      getHouseholdMembers(household.id),
    ]);

  return (
    <ChoreList
      dueToday={dueToday}
      upcoming={upcoming}
      overdue={overdue}
      recentlyCompleted={recentlyCompleted}
      members={members}
      currentUserId={user.id}
    />
  );
}
