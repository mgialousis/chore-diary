import { requireHousehold } from "@/lib/household";
import { RecipeForm } from "@/components/recipes/recipe-form";

export default async function NewRecipePage() {
  const { household } = await requireHousehold();

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">New Recipe</h1>
      <RecipeForm householdId={household.id} />
    </div>
  );
}
