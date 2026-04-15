"use server";

import { db } from "@/lib/db";
import { requireHousehold } from "@/lib/household";
import { logActivity } from "@/actions/activity";
import { recipeSchema, type RecipeFormValues } from "@/types";
import { revalidatePath } from "next/cache";

function normalizeIngredientName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/ies$/, "y")
    .replace(/ves$/, "f")
    .replace(/es$/, "")
    .replace(/s$/, "");
}

export async function createRecipe(data: RecipeFormValues) {
  const { user, household } = await requireHousehold();

  const parsed = recipeSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const recipe = await db.recipe.create({
    data: {
      householdId: household.id,
      createdByUserId: user.id,
      name: parsed.data.name,
      description: parsed.data.description,
      defaultServings: parsed.data.defaultServings,
      mealType: parsed.data.mealType,
      prepTimeMinutes: parsed.data.prepTimeMinutes,
      instructions: parsed.data.instructions,
      tags: parsed.data.tags,
      ingredients: {
        create: parsed.data.ingredients.map((ing) => ({
          ingredientName: ing.ingredientName,
          normalizedName: normalizeIngredientName(ing.ingredientName),
          quantity: ing.quantity,
          unit: ing.unit,
          isOptional: ing.isOptional,
          sortOrder: ing.sortOrder,
        })),
      },
    },
  });

  await logActivity({
    householdId: household.id,
    userId: user.id,
    eventType: "RECIPE_CREATED",
    entityType: "recipe",
    entityId: recipe.id,
    message: `${user.name} created recipe "${recipe.name}"`,
  });

  revalidatePath("/recipes");
  return { id: recipe.id };
}

export async function updateRecipe(recipeId: string, data: RecipeFormValues) {
  const { household } = await requireHousehold();

  const existing = await db.recipe.findFirst({
    where: { id: recipeId, householdId: household.id },
  });
  if (!existing) return { error: "Recipe not found" };

  const parsed = recipeSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await db.recipe.update({
    where: { id: recipeId },
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      defaultServings: parsed.data.defaultServings,
      mealType: parsed.data.mealType,
      prepTimeMinutes: parsed.data.prepTimeMinutes,
      instructions: parsed.data.instructions,
      tags: parsed.data.tags,
      ingredients: {
        deleteMany: {},
        create: parsed.data.ingredients.map((ing) => ({
          ingredientName: ing.ingredientName,
          normalizedName: normalizeIngredientName(ing.ingredientName),
          quantity: ing.quantity,
          unit: ing.unit,
          isOptional: ing.isOptional,
          sortOrder: ing.sortOrder,
        })),
      },
    },
  });

  revalidatePath("/recipes");
  revalidatePath(`/recipes/${recipeId}`);
  revalidatePath("/meals");
}

export async function deleteRecipe(recipeId: string) {
  const { user, household } = await requireHousehold();

  const existing = await db.recipe.findFirst({
    where: { id: recipeId, householdId: household.id },
    include: {
      mealPlans: {
        where: { date: { gte: new Date() } },
        take: 1,
      },
    },
  });
  if (!existing) return { error: "Recipe not found" };

  if (existing.mealPlans.length > 0) {
    return { error: "This recipe is used in upcoming meal plans. Remove it from the meal plan first." };
  }

  await db.recipe.delete({ where: { id: recipeId } });

  await logActivity({
    householdId: household.id,
    userId: user.id,
    eventType: "RECIPE_DELETED",
    entityType: "recipe",
    entityId: recipeId,
    message: `${user.name} deleted recipe "${existing.name}"`,
  });

  revalidatePath("/recipes");
}

export async function getIngredientSuggestions(
  query: string,
): Promise<string[]> {
  const { household } = await requireHousehold();
  const q = query.toLowerCase().trim();

  // Load seed list
  const seedList: string[] = (
    await import("../../prisma/data/ingredients.json")
  ).default;

  // Get household history
  const usedIngredients = await db.recipeIngredient.findMany({
    where: {
      recipe: { householdId: household.id },
      ...(q ? { ingredientName: { contains: q, mode: "insensitive" } } : {}),
    },
    select: { ingredientName: true },
    distinct: ["ingredientName"],
    orderBy: { ingredientName: "asc" },
    take: q ? 8 : 16,
  });

  const householdNames = usedIngredients.map((i) => i.ingredientName);

  const seedMatches = (q
    ? seedList.filter((s) => s.toLowerCase().startsWith(q))
    : seedList
  ).slice(0, q ? 10 : 20);

  // Merge: household history first, then seed matches, deduplicate
  const merged = [
    ...householdNames,
    ...seedMatches.filter(
      (s) => !householdNames.some((h) => h.toLowerCase() === s.toLowerCase()),
    ),
  ].slice(0, q ? 12 : 24);

  return merged;
}
