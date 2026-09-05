import { describe, expect, it } from "vitest";
import { choreTemplateSchema, mealPlanSchema, recipeSchema } from "./index";

describe("household planning schemas", () => {
  it("requires either a saved recipe or a custom meal name", () => {
    const baseMeal = {
      date: new Date(2026, 8, 7),
      mealSlot: "DINNER" as const,
      recipeId: null,
      customMealName: null,
      assignedUserId: null,
      servings: 2,
      notes: "",
    };

    expect(mealPlanSchema.safeParse(baseMeal).success).toBe(false);
    expect(
      mealPlanSchema.safeParse({ ...baseMeal, customMealName: "Vegetable curry" })
        .success,
    ).toBe(true);
  });

  it("rejects invalid recurrence intervals", () => {
    const result = choreTemplateSchema.safeParse({
      name: "Clean the kitchen",
      category: "CLEANING",
      assignedUserId: null,
      recurrenceType: "EVERY_N_DAYS",
      recurrenceInterval: 0,
      daysOfWeek: [],
      startDate: new Date(2026, 8, 7),
      notes: "",
    });

    expect(result.success).toBe(false);
  });

  it("requires at least one positive-quantity recipe ingredient", () => {
    const recipe = {
      name: "Pasta",
      description: "",
      defaultServings: 2,
      mealType: "DINNER" as const,
      prepTimeMinutes: 20,
      instructions: "Boil and serve",
      tags: ["quick"],
      ingredients: [],
    };

    expect(recipeSchema.safeParse(recipe).success).toBe(false);
    expect(
      recipeSchema.safeParse({
        ...recipe,
        ingredients: [
          {
            ingredientName: "Pasta",
            quantity: 0,
            unit: "g",
            isOptional: false,
            sortOrder: 0,
          },
        ],
      }).success,
    ).toBe(false);
    expect(
      recipeSchema.safeParse({
        ...recipe,
        ingredients: [
          {
            ingredientName: "Pasta",
            quantity: 200,
            unit: "g",
            isOptional: false,
            sortOrder: 0,
          },
        ],
      }).success,
    ).toBe(true);
  });
});
