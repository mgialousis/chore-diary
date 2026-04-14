"use server";

import { db } from "@/lib/db";
import { requireHousehold } from "@/lib/household";
import { toDateOnly } from "@/lib/date";
import { logActivity } from "@/actions/activity";
import { mealPlanSchema, type MealPlanFormValues } from "@/types";
import { revalidatePath } from "next/cache";
import type { MealSlot } from "@prisma/client";

export async function planMeal(data: MealPlanFormValues) {
  const { user, household } = await requireHousehold();

  const parsed = mealPlanSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const mealDate = toDateOnly(parsed.data.date);

  const meal = await db.mealPlan.upsert({
    where: {
      householdId_date_mealSlot: {
        householdId: household.id,
        date: mealDate,
        mealSlot: parsed.data.mealSlot,
      },
    },
    create: {
      householdId: household.id,
      date: mealDate,
      mealSlot: parsed.data.mealSlot,
      recipeId: parsed.data.recipeId,
      customMealName: parsed.data.customMealName,
      assignedUserId: parsed.data.assignedUserId,
      servings: parsed.data.servings,
      notes: parsed.data.notes,
    },
    update: {
      recipeId: parsed.data.recipeId,
      customMealName: parsed.data.customMealName,
      assignedUserId: parsed.data.assignedUserId,
      servings: parsed.data.servings,
      notes: parsed.data.notes,
      status: "PLANNED",
    },
    include: { recipe: true },
  });

  const mealName = meal.recipe?.name ?? meal.customMealName ?? "a meal";

  await logActivity({
    householdId: household.id,
    userId: user.id,
    eventType: "MEAL_PLANNED",
    entityType: "meal",
    entityId: meal.id,
    message: `${user.name} planned ${mealName}`,
  });

  revalidatePath("/meals");
  revalidatePath("/today");
  revalidatePath("/groceries");
}

export async function markMealCooked(mealPlanId: string) {
  const { user, household } = await requireHousehold();

  const meal = await db.mealPlan.update({
    where: { id: mealPlanId, householdId: household.id },
    data: {
      status: "COOKED",
      cookedAt: new Date(),
      cookedByUserId: user.id,
    },
    include: { recipe: true },
  });

  const mealName = meal.recipe?.name ?? meal.customMealName ?? "a meal";

  await logActivity({
    householdId: household.id,
    userId: user.id,
    eventType: "MEAL_COOKED",
    entityType: "meal",
    entityId: meal.id,
    message: `${user.name} cooked ${mealName}`,
  });

  revalidatePath("/meals");
  revalidatePath("/today");
  revalidatePath("/history");
}

export async function removeMeal(mealPlanId: string) {
  const { household } = await requireHousehold();

  await db.mealPlan.delete({
    where: { id: mealPlanId, householdId: household.id },
  });

  revalidatePath("/meals");
  revalidatePath("/today");
  revalidatePath("/groceries");
}

export async function duplicateMeal(
  mealPlanId: string,
  targetDate: Date,
  targetSlot: MealSlot,
) {
  const { household } = await requireHousehold();
  const normalizedTargetDate = toDateOnly(targetDate);

  const source = await db.mealPlan.findFirst({
    where: { id: mealPlanId, householdId: household.id },
  });
  if (!source) return { error: "Meal not found" };

  await db.mealPlan.upsert({
    where: {
      householdId_date_mealSlot: {
        householdId: household.id,
        date: normalizedTargetDate,
        mealSlot: targetSlot,
      },
    },
    create: {
      householdId: household.id,
      date: normalizedTargetDate,
      mealSlot: targetSlot,
      recipeId: source.recipeId,
      customMealName: source.customMealName,
      assignedUserId: source.assignedUserId,
      servings: source.servings,
      notes: source.notes,
    },
    update: {
      recipeId: source.recipeId,
      customMealName: source.customMealName,
      assignedUserId: source.assignedUserId,
      servings: source.servings,
      status: "PLANNED",
    },
  });

  revalidatePath("/meals");
}
