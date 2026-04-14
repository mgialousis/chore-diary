"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { toDateOnly } from "@/lib/date";
import { requireHousehold } from "@/lib/household";
import { logActivity } from "@/actions/activity";
import { revalidatePath } from "next/cache";
import type { GroceryCategory } from "@prisma/client";

// ─── Types ──────────────────────────────────────────────────

export interface AggregatedIngredient {
  name: string;
  normalizedName: string;
  quantity: number;
  unit: string | null;
  category: GroceryCategory;
  sources: string[];
}

// ─── Category inference ──────────────────────────────────────

const CATEGORY_KEYWORDS: Record<GroceryCategory, string[]> = {
  VEGETABLES: [
    "tomato", "onion", "garlic", "carrot", "potato", "pepper", "broccoli",
    "spinach", "zucchini", "mushroom", "lettuce", "cucumber", "eggplant",
    "celery", "corn", "pea", "green bean", "cauliflower", "cabbage", "kale",
    "leek", "asparagus", "beetroot", "radish", "fennel", "artichoke",
  ],
  FRUIT: [
    "apple", "banana", "lemon", "lime", "orange", "avocado", "strawberry",
    "blueberry", "mango", "pineapple", "grape", "peach", "pear", "cherry",
    "raspberry", "watermelon", "melon", "kiwi", "plum", "apricot",
  ],
  DAIRY: [
    "milk", "butter", "cream", "cheese", "yogurt", "mozzarella", "parmesan",
    "feta", "cheddar", "ricotta", "sour cream", "cream cheese", "egg",
  ],
  MEAT_FISH: [
    "chicken", "beef", "pork", "salmon", "shrimp", "turkey", "lamb",
    "tuna", "cod", "tilapia", "sausage", "bacon", "ham", "duck",
    "ground beef", "ground turkey", "chicken breast", "chicken thigh",
  ],
  PANTRY: [
    "oil", "flour", "sugar", "rice", "pasta", "salt", "pepper", "soy sauce",
    "vinegar", "honey", "mustard", "ketchup", "tomato sauce", "canned tomato",
    "coconut milk", "broth", "stock", "oregano", "basil", "cumin", "paprika",
    "chili", "cinnamon", "garlic powder", "onion powder", "baking powder",
    "baking soda", "cornstarch", "peanut butter", "bread", "yeast",
  ],
  FROZEN: ["frozen", "ice cream"],
  CLEANING_SUPPLIES: [
    "detergent", "soap", "bleach", "sponge", "cleaning", "dishwasher",
    "laundry", "fabric softener",
  ],
  BATHROOM_SUPPLIES: [
    "shampoo", "conditioner", "toothpaste", "toothbrush", "toilet paper",
    "tissues", "deodorant", "razor",
  ],
  OTHER: [],
};

function inferGroceryCategory(normalizedName: string): GroceryCategory {
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (category === "OTHER") continue;
    if (keywords.some((kw) => normalizedName.includes(kw))) {
      return category as GroceryCategory;
    }
  }
  return "OTHER";
}

// ─── Generate grocery list (dynamic, not stored) ─────────────

export async function generateGroceryList(
  householdId: string,
  startDate: Date,
  endDate: Date,
): Promise<AggregatedIngredient[]> {
  const normalizedStartDate = toDateOnly(startDate);
  const normalizedEndDate = toDateOnly(endDate);

  const meals = await db.mealPlan.findMany({
    where: {
      householdId,
      date: { gte: normalizedStartDate, lte: normalizedEndDate },
      status: "PLANNED",
      recipeId: { not: null },
    },
    include: {
      recipe: {
        include: { ingredients: true },
      },
    },
  });

  const aggregated = new Map<string, AggregatedIngredient>();

  for (const meal of meals) {
    if (!meal.recipe) continue;
    const ratio = meal.servings / (meal.recipe.defaultServings || 2);
    for (const ing of meal.recipe.ingredients) {
      const key = `${ing.normalizedName}__${ing.unit ?? "piece"}`;
      if (aggregated.has(key)) {
        aggregated.get(key)!.quantity += ing.quantity * ratio;
        const sources = aggregated.get(key)!.sources;
        if (!sources.includes(meal.recipe.name)) {
          sources.push(meal.recipe.name);
        }
      } else {
        aggregated.set(key, {
          name: ing.ingredientName,
          normalizedName: ing.normalizedName,
          quantity: ing.quantity * ratio,
          unit: ing.unit,
          category: inferGroceryCategory(ing.normalizedName),
          sources: [meal.recipe.name],
        });
      }
    }
  }

  return Array.from(aggregated.values()).sort(
    (a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name),
  );
}

// ─── Manual grocery item schema ──────────────────────────────

const manualItemSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  quantity: z.number().positive(),
  unit: z.string().nullable(),
  category: z.enum([
    "VEGETABLES", "FRUIT", "DAIRY", "MEAT_FISH", "PANTRY",
    "FROZEN", "CLEANING_SUPPLIES", "BATHROOM_SUPPLIES", "OTHER",
  ]),
});

export type ManualItemFormValues = z.infer<typeof manualItemSchema>;

export async function addManualGroceryItem(data: ManualItemFormValues) {
  const { user, household } = await requireHousehold();

  const parsed = manualItemSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const item = await db.groceryItem.create({
    data: {
      householdId: household.id,
      name: parsed.data.name,
      quantity: parsed.data.quantity,
      unit: parsed.data.unit,
      category: parsed.data.category,
      sourceType: "MANUAL",
    },
  });

  await logActivity({
    householdId: household.id,
    userId: user.id,
    eventType: "GROCERY_ADDED",
    entityType: "grocery",
    entityId: item.id,
    message: `${user.name} added ${item.name} to the grocery list`,
  });

  revalidatePath("/groceries");
}

export async function toggleGroceryItemChecked(itemId: string) {
  const { household } = await requireHousehold();

  const item = await db.groceryItem.findFirst({
    where: { id: itemId, householdId: household.id },
  });
  if (!item) return { error: "Item not found" };

  await db.groceryItem.update({
    where: { id: itemId },
    data: { checked: !item.checked },
  });

  revalidatePath("/groceries");
  revalidatePath("/today");
}

export async function markGroceryBought(itemId: string) {
  const { user, household } = await requireHousehold();

  const item = await db.groceryItem.update({
    where: { id: itemId, householdId: household.id },
    data: { status: "BOUGHT", checked: true },
  });

  await logActivity({
    householdId: household.id,
    userId: user.id,
    eventType: "GROCERY_BOUGHT",
    entityType: "grocery",
    entityId: item.id,
    message: `${user.name} bought ${item.name}`,
  });

  revalidatePath("/groceries");
  revalidatePath("/today");
}

export async function deleteGroceryItem(itemId: string) {
  const { household } = await requireHousehold();

  await db.groceryItem.delete({
    where: { id: itemId, householdId: household.id },
  });

  revalidatePath("/groceries");
}

export async function clearBoughtItems() {
  const { household } = await requireHousehold();

  await db.groceryItem.updateMany({
    where: { householdId: household.id, status: "BOUGHT" },
    data: { status: "ARCHIVED" },
  });

  revalidatePath("/groceries");
  revalidatePath("/today");
}
