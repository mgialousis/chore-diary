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

export async function getHouseholdMembers(householdId: string) {
  return db.householdMember.findMany({
    where: { householdId },
    include: { user: true },
  });
}
