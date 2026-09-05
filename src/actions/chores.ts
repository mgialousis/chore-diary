"use server";

import { db } from "@/lib/db";
import { requireHousehold } from "@/lib/household";
import { logActivity } from "@/actions/activity";
import { choreTemplateSchema, type ChoreTemplateFormValues } from "@/types";
import { toDateOnly } from "@/lib/date";
import { calculateChoreSchedule } from "@/domain/chore-schedule";
import { revalidatePath } from "next/cache";
import { addDays } from "date-fns";
import type { ChoreTemplate } from "@prisma/client";

// ─── Instance Generation ────────────────────────────────────

async function generateChoreInstances(template: ChoreTemplate) {
  const today = toDateOnly(new Date());
  const horizon = toDateOnly(addDays(today, 14));
  const startDate = toDateOnly(
    template.nextDueDate ? new Date(template.nextDueDate) : today,
  );

  const { dueDates, nextDueDate } = calculateChoreSchedule({
    recurrenceType: template.recurrenceType,
    recurrenceInterval: template.recurrenceInterval,
    daysOfWeek: template.daysOfWeek,
    startDate,
    today,
    horizon,
  });

  if (dueDates.length === 0) return;

  await db.choreInstance.createMany({
    data: dueDates.map((date) => ({
      householdId: template.householdId,
      choreTemplateId: template.id,
      name: template.name,
      category: template.category,
      assignedUserId: template.assignedUserId,
      dueDate: toDateOnly(date),
    })),
    skipDuplicates: true,
  });

  await db.choreTemplate.update({
    where: { id: template.id },
    data: { nextDueDate: nextDueDate ? toDateOnly(nextDueDate) : null },
  });
}

// ─── Server Actions ─────────────────────────────────────────

export async function createChoreTemplate(data: ChoreTemplateFormValues) {
  const { household } = await requireHousehold();

  const parsed = choreTemplateSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const template = await db.choreTemplate.create({
    data: {
      householdId: household.id,
      name: parsed.data.name,
      category: parsed.data.category,
      assignedUserId: parsed.data.assignedUserId,
      recurrenceType: parsed.data.recurrenceType,
      recurrenceInterval: parsed.data.recurrenceInterval,
      daysOfWeek: parsed.data.daysOfWeek,
      nextDueDate: toDateOnly(parsed.data.startDate),
      notes: parsed.data.notes,
    },
  });

  await generateChoreInstances(template);

  revalidatePath("/chores");
  revalidatePath("/today");
}

export async function updateChoreTemplate(
  templateId: string,
  data: Partial<ChoreTemplateFormValues>,
) {
  const { household } = await requireHousehold();

  const template = await db.choreTemplate.findFirst({
    where: { id: templateId, householdId: household.id },
  });
  if (!template) return { error: "Chore not found" };

  const updated = await db.choreTemplate.update({
    where: { id: templateId },
    data: {
      name: data.name,
      category: data.category,
      assignedUserId: data.assignedUserId,
      recurrenceType: data.recurrenceType,
      recurrenceInterval: data.recurrenceInterval,
      daysOfWeek: data.daysOfWeek,
      nextDueDate: data.startDate ? toDateOnly(data.startDate) : undefined,
      notes: data.notes,
    },
  });

  // Propagate display fields to all existing instances so past/completed
  // chores reflect the updated template (assignee chip, name, category).
  await db.choreInstance.updateMany({
    where: {
      choreTemplateId: templateId,
      householdId: household.id,
    },
    data: {
      name: data.name,
      category: data.category,
      assignedUserId: data.assignedUserId,
    },
  });

  // Delete future pending instances and regenerate
  await db.choreInstance.deleteMany({
    where: {
      choreTemplateId: templateId,
      householdId: household.id,
      status: "PENDING",
      dueDate: { gte: toDateOnly(new Date()) },
    },
  });

  await generateChoreInstances(updated);

  revalidatePath("/chores");
  revalidatePath("/today");
}

export async function toggleChoreTemplateActive(templateId: string) {
  const { household } = await requireHousehold();

  const template = await db.choreTemplate.findFirst({
    where: { id: templateId, householdId: household.id },
  });
  if (!template) return { error: "Chore not found" };

  const updated = await db.choreTemplate.update({
    where: { id: templateId },
    data: { isActive: !template.isActive },
  });

  if (!updated.isActive) {
    // Deactivating: remove future pending instances
    await db.choreInstance.deleteMany({
      where: {
        choreTemplateId: templateId,
        householdId: household.id,
        status: "PENDING",
        dueDate: { gte: toDateOnly(new Date()) },
      },
    });
  } else {
    // Reactivating: regenerate instances
    await generateChoreInstances(updated);
  }

  revalidatePath("/chores");
  revalidatePath("/today");
}

export async function completeChore(choreInstanceId: string): Promise<{ error?: string } | void> {
  const { user, household } = await requireHousehold();

  const existing = await db.choreInstance.findFirst({
    where: { id: choreInstanceId, householdId: household.id },
  });
  if (!existing) return { error: "Chore not found" };

  const creditUserId = existing.assignedUserId ?? user.id;
  const creditUser =
    creditUserId === user.id
      ? user
      : (await db.user.findUnique({ where: { id: creditUserId } })) ?? user;

  const chore = await db.choreInstance.update({
    where: { id: choreInstanceId, householdId: household.id },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
      completedByUserId: creditUserId,
    },
  });

  await logActivity({
    householdId: household.id,
    userId: creditUserId,
    eventType: "CHORE_COMPLETED",
    entityType: "chore",
    entityId: chore.id,
    message: `${creditUser.name} completed ${chore.name}`,
  });

  revalidatePath("/chores");
  revalidatePath("/today");
}

export async function skipChore(choreInstanceId: string): Promise<{ error?: string } | void> {
  const { user, household } = await requireHousehold();

  const chore = await db.choreInstance.update({
    where: { id: choreInstanceId, householdId: household.id },
    data: { status: "SKIPPED" },
  });

  await logActivity({
    householdId: household.id,
    userId: user.id,
    eventType: "CHORE_SKIPPED",
    entityType: "chore",
    entityId: chore.id,
    message: `${user.name} skipped ${chore.name}`,
  });

  revalidatePath("/chores");
  revalidatePath("/today");
}

export async function postponeChore(
  choreInstanceId: string,
  targetDate: Date,
): Promise<{ error?: string } | void> {
  const { user, household } = await requireHousehold();

  const normalizedTargetDate = toDateOnly(targetDate);
  const tomorrow = toDateOnly(addDays(new Date(), 1));

  if (normalizedTargetDate < tomorrow) {
    return { error: "Please choose tomorrow or a later date" };
  }

  const existing = await db.choreInstance.findFirst({
    where: { id: choreInstanceId, householdId: household.id },
  });

  if (!existing) return { error: "Chore not found" };

  const chore = await db.choreInstance.update({
    where: { id: choreInstanceId, householdId: household.id },
    data: {
      dueDate: normalizedTargetDate,
      status: "PENDING",
      completedAt: null,
      completedByUserId: null,
    },
  });

  await logActivity({
    householdId: household.id,
    userId: user.id,
    eventType: "CHORE_POSTPONED",
    entityType: "chore",
    entityId: chore.id,
    message: `${user.name} postponed ${chore.name} to ${normalizedTargetDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`,
  });

  revalidatePath("/chores");
  revalidatePath("/today");
}

export async function deleteChoreTemplate(templateId: string): Promise<{ error?: string } | void> {
  const { user, household } = await requireHousehold();

  const template = await db.choreTemplate.findFirst({
    where: { id: templateId, householdId: household.id },
  });

  if (!template) return { error: "Chore not found" };

  await db.choreInstance.deleteMany({
    where: {
      householdId: household.id,
      choreTemplateId: templateId,
    },
  });

  await db.choreTemplate.delete({
    where: { id: templateId },
  });

  await logActivity({
    householdId: household.id,
    userId: user.id,
    eventType: "CHORE_DELETED",
    entityType: "chore",
    entityId: templateId,
    message: `${user.name} deleted ${template.name}`,
  });

  revalidatePath("/chores");
  revalidatePath("/today");
}
