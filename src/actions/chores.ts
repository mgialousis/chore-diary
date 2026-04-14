"use server";

import { db } from "@/lib/db";
import { requireHousehold } from "@/lib/household";
import { logActivity } from "@/actions/activity";
import { choreTemplateSchema, type ChoreTemplateFormValues } from "@/types";
import { revalidatePath } from "next/cache";
import { addDays, startOfDay, getDay } from "date-fns";
import type { ChoreTemplate } from "@prisma/client";

// ─── Instance Generation ────────────────────────────────────

async function generateChoreInstances(template: ChoreTemplate) {
  const today = startOfDay(new Date());
  const horizon = addDays(today, 14);
  const startDate = startOfDay(
    template.nextDueDate ? new Date(template.nextDueDate) : today,
  );

  const dueDates: Date[] = [];

  switch (template.recurrenceType) {
    case "NONE": {
      // Only create one instance (on nextDueDate / startDate)
      if (startDate >= today && startDate <= horizon) {
        dueDates.push(startDate);
      }
      break;
    }
    case "DAILY": {
      let d = startDate < today ? today : startDate;
      while (d <= horizon) {
        dueDates.push(d);
        d = addDays(d, 1);
      }
      break;
    }
    case "EVERY_N_DAYS": {
      const interval = template.recurrenceInterval ?? 1;
      let d = startDate < today ? today : startDate;
      while (d <= horizon) {
        dueDates.push(d);
        d = addDays(d, interval);
      }
      break;
    }
    case "WEEKLY": {
      let d = startDate < today ? today : startDate;
      while (d <= horizon) {
        dueDates.push(d);
        d = addDays(d, 7);
      }
      break;
    }
    case "SPECIFIC_DAYS": {
      const days = template.daysOfWeek;
      let d = startDate < today ? today : startDate;
      while (d <= horizon) {
        if (days.includes(getDay(d))) {
          dueDates.push(d);
        }
        d = addDays(d, 1);
      }
      break;
    }
  }

  if (dueDates.length === 0) return;

  await db.choreInstance.createMany({
    data: dueDates.map((date) => ({
      householdId: template.householdId,
      choreTemplateId: template.id,
      name: template.name,
      category: template.category,
      assignedUserId: template.assignedUserId,
      dueDate: date,
    })),
    skipDuplicates: true,
  });

  const nextDue = dueDates[dueDates.length - 1];
  await db.choreTemplate.update({
    where: { id: template.id },
    data: { nextDueDate: addDays(nextDue, template.recurrenceInterval ?? 1) },
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
      nextDueDate: parsed.data.startDate,
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
      nextDueDate: data.startDate,
      notes: data.notes,
    },
  });

  // Delete future pending instances and regenerate
  await db.choreInstance.deleteMany({
    where: {
      choreTemplateId: templateId,
      householdId: household.id,
      status: "PENDING",
      dueDate: { gte: startOfDay(new Date()) },
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
        dueDate: { gte: startOfDay(new Date()) },
      },
    });
  } else {
    // Reactivating: regenerate instances
    await generateChoreInstances(updated);
  }

  revalidatePath("/chores");
}

export async function completeChore(choreInstanceId: string): Promise<{ error?: string } | void> {
  const { user, household } = await requireHousehold();

  const chore = await db.choreInstance.update({
    where: { id: choreInstanceId, householdId: household.id },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
      completedByUserId: user.id,
    },
  });

  await logActivity({
    householdId: household.id,
    userId: user.id,
    eventType: "CHORE_COMPLETED",
    entityType: "chore",
    entityId: chore.id,
    message: `${user.name} completed ${chore.name}`,
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
