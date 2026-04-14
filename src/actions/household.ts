"use server";

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { z } from "zod";

const createHouseholdSchema = z.object({
  name: z.string().min(1, "Name is required").max(50),
});

const joinHouseholdSchema = z.object({
  inviteCode: z.string().min(1, "Invite code is required"),
});

export async function createHousehold(formData: FormData) {
  const user = await requireAuth();

  const parsed = createHouseholdSchema.safeParse({
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const inviteCode = crypto.randomUUID().slice(0, 8);

  const household = await db.household.create({
    data: {
      name: parsed.data.name,
      inviteCode,
      members: {
        create: {
          userId: user.id,
          role: "OWNER",
        },
      },
    },
  });

  if (!household) {
    return { error: "Failed to create household" };
  }

  redirect("/today");
}

export async function joinHousehold(formData: FormData) {
  const user = await requireAuth();

  const parsed = joinHouseholdSchema.safeParse({
    inviteCode: formData.get("inviteCode"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const household = await db.household.findUnique({
    where: { inviteCode: parsed.data.inviteCode },
    include: { members: true },
  });

  if (!household) {
    return { error: "Household not found. Check the invite code." };
  }

  if (household.members.length >= 2) {
    return { error: "This household already has 2 members." };
  }

  const existingMember = household.members.find((m) => m.userId === user.id);
  if (existingMember) {
    return { error: "You are already a member of this household." };
  }

  await db.householdMember.create({
    data: {
      householdId: household.id,
      userId: user.id,
      role: "MEMBER",
    },
  });

  redirect("/today");
}
