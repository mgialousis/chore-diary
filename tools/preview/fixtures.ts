import { addDays, startOfDay } from "date-fns";

// Synthetic fixtures only. This file never reads environment files or a database.
const today = startOfDay(new Date());
const alex = { id: "demo-alex", name: "Alex", colorPreference: "SKY" };
const sam = { id: "demo-sam", name: "Sam", colorPreference: "ROSE" };
const household = { id: "demo-household", name: "Alex & Sam" };

export async function requireHousehold() { return { user: alex, household }; }

function chore(id: string, name: string, category: string, offset = 0) {
  return { id, name, category, dueDate: addDays(today, offset), status: "PENDING",
    assignedUserId: offset ? sam.id : alex.id, choreTemplate: null, completedBy: null };
}

export const db = {
  mealPlan: { findMany: async () => [
    { id: "demo-lunch", mealSlot: "LUNCH", customMealName: "Greek Salad", recipe: null,
      servings: 2, status: "PLANNED", assignedTo: alex, cookedBy: null },
    { id: "demo-dinner", mealSlot: "DINNER", customMealName: "Lentil Curry", recipe: null,
      servings: 4, status: "PLANNED", assignedTo: sam, cookedBy: null },
  ] },
  choreInstance: { findMany: async ({ where }: { where: { dueDate: Date | { lt?: Date; gt?: Date } } }) => {
    if (where.dueDate instanceof Date) return [
      chore("demo-dishes", "Unload the dishwasher", "DISHES"),
      chore("demo-plants", "Water the plants", "OTHER"),
    ];
    if (where.dueDate.lt) return [];
    return [chore("demo-laundry", "Wash bed linen", "LAUNDRY", 1),
      chore("demo-clean", "Clean the bathroom", "BATHROOM", 2)];
  } },
  groceryItem: { findMany: async () => [
    { id: "demo-tomato", name: "Tomatoes", quantity: 3, unit: "piece", checked: false, status: "NEEDED", category: "PRODUCE" },
    { id: "demo-lentils", name: "Lentils", quantity: 250, unit: "g", checked: false, status: "NEEDED", category: "PANTRY" },
    { id: "demo-milk", name: "Coconut milk", quantity: 400, unit: "ml", checked: false, status: "NEEDED", category: "PANTRY" },
  ] },
  householdMember: { findMany: async () => [{ userId: alex.id, user: alex }, { userId: sam.id, user: sam }] },
};
