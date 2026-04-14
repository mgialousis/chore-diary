import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, Users } from "lucide-react";
import { db } from "@/lib/db";
import { requireHousehold } from "@/lib/household";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { RecipeActions } from "@/components/recipes/recipe-actions";

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { household } = await requireHousehold();

  const recipe = await db.recipe.findFirst({
    where: { id, householdId: household.id },
    include: { ingredients: { orderBy: { sortOrder: "asc" } }, createdBy: true },
  });

  if (!recipe) notFound();

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Back */}
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/recipes">
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Recipes
        </Link>
      </Button>

      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold leading-tight">{recipe.name}</h1>
          <RecipeActions recipeId={recipe.id} householdId={household.id} recipe={{
            name: recipe.name,
            description: recipe.description ?? undefined,
            defaultServings: recipe.defaultServings,
            mealType: recipe.mealType,
            prepTimeMinutes: recipe.prepTimeMinutes,
            instructions: recipe.instructions ?? undefined,
            tags: recipe.tags,
            ingredients: recipe.ingredients.map((ing) => ({
              ingredientName: ing.ingredientName,
              quantity: ing.quantity,
              unit: ing.unit,
              isOptional: ing.isOptional,
              sortOrder: ing.sortOrder,
            })),
          }} />
        </div>

        {recipe.description && (
          <p className="text-muted-foreground">{recipe.description}</p>
        )}

        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {recipe.defaultServings} servings
          </span>
          {recipe.prepTimeMinutes && (
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {recipe.prepTimeMinutes} min
            </span>
          )}
          {recipe.mealType && (
            <Badge variant="secondary">
              {recipe.mealType === "LUNCH" ? "Lunch" : "Dinner"}
            </Badge>
          )}
        </div>

        {recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {recipe.tags.map((tag) => (
              <Badge key={tag} variant="outline">{tag}</Badge>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Ingredients */}
      <section className="space-y-3">
        <h2 className="font-semibold text-lg">Ingredients</h2>
        <ul className="space-y-1.5">
          {recipe.ingredients.map((ing) => (
            <li key={ing.id} className="flex items-baseline gap-2 text-sm">
              <span className="font-medium tabular-nums">
                {ing.quantity} {ing.unit ?? ""}
              </span>
              <span>{ing.ingredientName}</span>
              {ing.isOptional && (
                <span className="text-muted-foreground text-xs">(optional)</span>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* Instructions */}
      {recipe.instructions && (
        <>
          <Separator />
          <section className="space-y-3">
            <h2 className="font-semibold text-lg">Instructions</h2>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{recipe.instructions}</p>
          </section>
        </>
      )}
    </div>
  );
}
