import { z } from "zod";
import type {
  ActivityLog,
  ChoreInstance,
  ChoreTemplate,
  GroceryItem,
  MealPlan,
  Recipe,
  RecipeIngredient,
  User,
} from "@prisma/client";

// ─── Chore Schemas ─────────────────────────────────────────

export const choreCategories = [
  "COOKING",
  "CLEANING",
  "LAUNDRY",
  "GROCERIES",
  "DISHES",
  "TRASH",
  "BATHROOM",
  "TIDYING",
  "HOUSEHOLD_ADMIN",
  "OTHER",
] as const;

export const recurrenceTypes = [
  "NONE",
  "DAILY",
  "EVERY_N_DAYS",
  "WEEKLY",
  "SPECIFIC_DAYS",
] as const;

export const choreTemplateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  category: z.enum(choreCategories),
  assignedUserId: z.string().nullable(),
  recurrenceType: z.enum(recurrenceTypes),
  recurrenceInterval: z.number().min(1).max(365).nullable(),
  daysOfWeek: z.array(z.number().min(0).max(6)),
  startDate: z.date(),
  notes: z.string().max(500).optional(),
});

export type ChoreTemplateFormValues = z.infer<typeof choreTemplateSchema>;

// ─── Recipe Schemas ─────────────────────────────────────────

export const ingredientSchema = z.object({
  ingredientName: z.string().min(1, "Name is required"),
  quantity: z.number().positive("Must be positive"),
  unit: z.string().nullable(),
  isOptional: z.boolean(),
  sortOrder: z.number(),
});

export const recipeSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(1000).optional(),
  defaultServings: z.number().min(1).max(20),
  mealType: z.enum(["LUNCH", "DINNER"]).nullable(),
  prepTimeMinutes: z.number().min(0).max(600).nullable(),
  instructions: z.string().max(5000).optional(),
  tags: z.array(z.string()),
  ingredients: z.array(ingredientSchema).min(1, "At least one ingredient is required"),
});

export type IngredientFormValues = z.infer<typeof ingredientSchema>;
export type RecipeFormValues = z.infer<typeof recipeSchema>;

// ─── Composite Types ────────────────────────────────────────

export type ChoreInstanceWithTemplate = ChoreInstance & {
  choreTemplate: ChoreTemplate | null;
  completedBy: User | null;
};

export type InactiveChoreTemplate = ChoreTemplate & {
  assignedUser: User | null;
};

export type RecipeWithIngredients = Recipe & {
  ingredients: RecipeIngredient[];
  createdBy: User;
};

// ─── Meal Plan Schemas ──────────────────────────────────────

export const mealPlanSchema = z
  .object({
    date: z.date(),
    mealSlot: z.enum(["LUNCH", "DINNER"]),
    recipeId: z.string().nullable(),
    customMealName: z.string().max(200).nullable(),
    assignedUserId: z.string().nullable(),
    servings: z.number().min(1).max(20),
    notes: z.string().max(500).optional(),
  })
  .refine((data) => data.recipeId || data.customMealName, {
    message: "Either select a recipe or enter a custom meal name",
    path: ["customMealName"],
  });

export type MealPlanFormValues = z.infer<typeof mealPlanSchema>;

export type MealPlanWithDetails = MealPlan & {
  recipe: Recipe | null;
  assignedTo: User | null;
  cookedBy: User | null;
};

export type ActivityLogWithUser = ActivityLog & {
  user: User;
};

export type GroceryItemSummary = Pick<
  GroceryItem,
  "id" | "name" | "quantity" | "unit" | "category" | "checked" | "status"
>;
