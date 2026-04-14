import Link from "next/link";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { requireHousehold } from "@/lib/household";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RecipeCard } from "@/components/recipes/recipe-card";

export default async function RecipesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; tags?: string }>;
}) {
  const { household } = await requireHousehold();
  const { search, tags } = await searchParams;

  const tagList = tags ? tags.split(",").filter(Boolean) : [];

  const [recipes, tagRecords] = await Promise.all([
    db.recipe.findMany({
      where: {
        householdId: household.id,
        ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
        ...(tagList.length > 0 ? { tags: { hasEvery: tagList } } : {}),
      },
      include: { ingredients: true, createdBy: true },
      orderBy: { createdAt: "desc" },
    }),
    db.recipe.findMany({
      where: { householdId: household.id },
      select: { tags: true },
    }),
  ]);

  const allTags = Array.from(
    new Set(tagRecords.flatMap((record) => record.tags)),
  ).sort((a, b) => a.localeCompare(b));

  function getFilterHref(nextTags: string[]) {
    const params = new URLSearchParams();

    if (search) params.set("search", search);
    if (nextTags.length > 0) params.set("tags", nextTags.join(","));

    const query = params.toString();
    return query ? `/recipes?${query}` : "/recipes";
  }

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

      <div className="space-y-3 rounded-xl border p-4">
        <form className="flex gap-2" action="/recipes">
          <Input
            name="search"
            defaultValue={search}
            placeholder="Search recipes..."
            className="max-w-sm"
          />
          {tags && <input type="hidden" name="tags" value={tags} />}
          <Button type="submit" variant="outline">Search</Button>
          {(search || tagList.length > 0) && (
            <Button type="button" variant="ghost" asChild>
              <Link href="/recipes">Clear</Link>
            </Button>
          )}
        </form>

        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => {
              const isActive = tagList.includes(tag);
              const nextTags = isActive
                ? tagList.filter((value) => value !== tag)
                : [...tagList, tag];

              return (
                <Link key={tag} href={getFilterHref(nextTags)}>
                  <Badge variant={isActive ? "default" : "outline"} className="cursor-pointer">
                    {tag}
                  </Badge>
                </Link>
              );
            })}
          </div>
        )}
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
