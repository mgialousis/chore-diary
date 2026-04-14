import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient, HouseholdRole, MealSlot } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required to run prisma/seed.ts");
}

const adapter = new PrismaPg(process.env.DATABASE_URL);
const db = new PrismaClient({ adapter });

type SampleRecipe = {
  name: string;
  description: string;
  mealType: MealSlot;
  defaultServings: number;
  prepTimeMinutes: number;
  tags: string[];
  instructions: string;
  ingredients: Array<{
    ingredientName: string;
    quantity: number;
    unit: string | null;
    isOptional?: boolean;
  }>;
};

function normalizeIngredientName(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/ies$/, "y")
    .replace(/ves$/, "f")
    .replace(/es$/, "")
    .replace(/s$/, "");
}

async function readIngredientSeedList() {
  const filePath = path.join(__dirname, "data", "ingredients.json");
  const content = await readFile(filePath, "utf8");
  const ingredients = JSON.parse(content) as string[];

  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    throw new Error("Ingredient seed list is empty or invalid.");
  }

  return ingredients;
}

function buildSampleRecipes(): SampleRecipe[] {
  return [
    {
      name: "Lentil Curry",
      description: "Weeknight lentil curry with spinach and coconut milk.",
      mealType: "DINNER",
      defaultServings: 4,
      prepTimeMinutes: 35,
      tags: ["vegetarian", "cheap", "batch-cook"],
      instructions:
        "Saute onion, garlic, and spices. Add lentils, tomatoes, and coconut milk. Simmer until tender, then fold in spinach.",
      ingredients: [
        { ingredientName: "Onion", quantity: 1, unit: "piece" },
        { ingredientName: "Garlic", quantity: 3, unit: "piece" },
        { ingredientName: "Lentils", quantity: 250, unit: "g" },
        { ingredientName: "Coconut milk", quantity: 400, unit: "ml" },
        { ingredientName: "Spinach", quantity: 150, unit: "g" },
      ],
    },
    {
      name: "Pasta Carbonara",
      description: "Creamy carbonara with eggs, parmesan, and pancetta.",
      mealType: "DINNER",
      defaultServings: 2,
      prepTimeMinutes: 25,
      tags: ["quick", "comfort"],
      instructions:
        "Cook pasta, crisp pancetta, whisk eggs and parmesan, then combine off-heat with pasta water for the sauce.",
      ingredients: [
        { ingredientName: "Spaghetti", quantity: 200, unit: "g" },
        { ingredientName: "Eggs", quantity: 3, unit: "piece" },
        { ingredientName: "Parmesan", quantity: 60, unit: "g" },
        { ingredientName: "Bacon", quantity: 100, unit: "g" },
      ],
    },
    {
      name: "Greek Salad",
      description: "Tomato, cucumber, olives, and feta with a lemon dressing.",
      mealType: "LUNCH",
      defaultServings: 2,
      prepTimeMinutes: 15,
      tags: ["fresh", "vegetarian", "light"],
      instructions:
        "Chop vegetables, whisk dressing, then toss with olives and feta right before serving.",
      ingredients: [
        { ingredientName: "Tomato", quantity: 3, unit: "piece" },
        { ingredientName: "Cucumber", quantity: 1, unit: "piece" },
        { ingredientName: "Feta cheese", quantity: 120, unit: "g" },
        { ingredientName: "Olive oil", quantity: 2, unit: "tbsp" },
      ],
    },
    {
      name: "Vegetable Stir Fry",
      description: "Fast stir fry with peppers, broccoli, and soy sauce.",
      mealType: "DINNER",
      defaultServings: 3,
      prepTimeMinutes: 20,
      tags: ["quick", "vegetarian"],
      instructions:
        "Stir fry vegetables over high heat, add soy sauce and aromatics, and finish with sesame oil.",
      ingredients: [
        { ingredientName: "Broccoli", quantity: 1, unit: "piece" },
        { ingredientName: "Bell pepper", quantity: 2, unit: "piece" },
        { ingredientName: "Soy sauce", quantity: 3, unit: "tbsp" },
        { ingredientName: "Garlic", quantity: 2, unit: "piece" },
      ],
    },
    {
      name: "Herb Omelette",
      description: "Simple omelette with herbs and a little cheese.",
      mealType: "LUNCH",
      defaultServings: 2,
      prepTimeMinutes: 10,
      tags: ["quick", "protein"],
      instructions:
        "Beat eggs, cook gently in butter, add herbs and cheese, then fold and serve immediately.",
      ingredients: [
        { ingredientName: "Eggs", quantity: 4, unit: "piece" },
        { ingredientName: "Butter", quantity: 1, unit: "tbsp" },
        { ingredientName: "Cheddar cheese", quantity: 40, unit: "g", isOptional: true },
        { ingredientName: "Fresh parsley", quantity: 1, unit: "tbsp", isOptional: true },
      ],
    },
  ];
}

async function ensureDemoData() {
  const clerkId = process.env.SEED_DEMO_CLERK_ID;
  const email = process.env.SEED_DEMO_EMAIL;
  const name = process.env.SEED_DEMO_NAME ?? "Demo User";
  const householdName = process.env.SEED_DEMO_HOUSEHOLD ?? "Demo Household";

  if (!clerkId || !email) {
    console.log(
      "Skipping demo recipe seed. Set SEED_DEMO_CLERK_ID and SEED_DEMO_EMAIL to create sample household data.",
    );
    return;
  }

  const user = await db.user.upsert({
    where: { clerkId },
    update: { name, email },
    create: { clerkId, name, email },
  });

  let membership = await db.householdMember.findFirst({
    where: { userId: user.id },
    include: { household: true },
  });

  if (!membership) {
    const household = await db.household.create({
      data: {
        name: householdName,
        inviteCode: randomUUID().slice(0, 8),
      },
    });

    membership = await db.householdMember.create({
      data: {
        householdId: household.id,
        userId: user.id,
        role: HouseholdRole.OWNER,
      },
      include: { household: true },
    });
  }

  const householdId = membership.householdId;

  for (const recipe of buildSampleRecipes()) {
    const existing = await db.recipe.findFirst({
      where: { householdId, name: recipe.name },
      select: { id: true },
    });

    if (existing) continue;

    await db.recipe.create({
      data: {
        householdId,
        createdByUserId: user.id,
        name: recipe.name,
        description: recipe.description,
        mealType: recipe.mealType,
        defaultServings: recipe.defaultServings,
        prepTimeMinutes: recipe.prepTimeMinutes,
        instructions: recipe.instructions,
        tags: recipe.tags,
        ingredients: {
          create: recipe.ingredients.map((ingredient, index) => ({
            ingredientName: ingredient.ingredientName,
            normalizedName: normalizeIngredientName(ingredient.ingredientName),
            quantity: ingredient.quantity,
            unit: ingredient.unit,
            isOptional: ingredient.isOptional ?? false,
            sortOrder: index,
          })),
        },
      },
    });
  }

  console.log(`Seeded sample recipes for household "${membership.household.name}".`);
}

async function main() {
  const ingredients = await readIngredientSeedList();
  console.log(`Loaded ${ingredients.length} ingredient suggestions from prisma/data/ingredients.json.`);
  await ensureDemoData();
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
