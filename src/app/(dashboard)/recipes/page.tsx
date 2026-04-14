import Link from "next/link";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { requireHousehold } from "@/lib/household";
import { Button } from "@/components/ui/button";
import { RecipeCard } from "@/components/recipes/recipe-card";

export default async function RecipesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; tags?: string }>;
}) {
  const { household } = await requireHousehold();
  const { search, tags } = await searchParams;

  const tagList = tags ? tags.split(",").filter(Boolean) : [];

  const recipes = await db.recipe.findMany({
    where: {
      householdId: household.id,
      ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
      ...(tagList.length > 0 ? { tags: { hasEvery: tagList } } : {}),
    },
    include: { ingredients: true, createdBy: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Recipes</h1>
        <Button asChild>
          <Link href="/recipes/new">
            <Plus className="h-4 w-4 mr-1.5" />
            New recipe
          </Link>
        </Button>
      </div>

      {recipes.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No recipes yet</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/recipes/new">Add your first recipe</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
}
