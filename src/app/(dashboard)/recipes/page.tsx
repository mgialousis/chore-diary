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
    <div className="space-y-6 p-4 md:p-6">
      <div className="rounded-3xl border bg-gradient-to-r from-orange-50 via-background to-amber-50 p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Household cookbook
            </p>
            <div className="space-y-1">
              <h1 className="text-3xl font-semibold tracking-tight">Recipes</h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Save your repeat favorites, filter by tags, and build meal plans from a shared recipe library.
              </p>
            </div>
          </div>
          <Button asChild className="rounded-full px-4">
            <Link href="/recipes/new">
              <Plus className="mr-1.5 h-4 w-4" />
              New recipe
            </Link>
          </Button>
        </div>
      </div>

      <div className="rounded-3xl border bg-card/90 p-5 shadow-sm">
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Browse recipes
            </p>
            <p className="text-sm text-muted-foreground">
              Search by name or narrow the list to the tags you actually cook with.
            </p>
          </div>
        <form className="flex flex-col gap-2 sm:flex-row" action="/recipes">
          <Input
            name="search"
            defaultValue={search}
            placeholder="Search recipes..."
            className="sm:max-w-sm"
          />
          {tags && <input type="hidden" name="tags" value={tags} />}
          <div className="flex gap-2">
            <Button type="submit" variant="outline" className="rounded-full">Search</Button>
          {(search || tagList.length > 0) && (
            <Button type="button" variant="ghost" className="rounded-full" asChild>
              <Link href="/recipes">Clear</Link>
            </Button>
          )}
          </div>
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
      </div>

      {recipes.length === 0 ? (
        <div className="rounded-3xl border border-dashed bg-muted/20 py-12 text-center text-muted-foreground">
          <p>No recipes saved. Create your first recipe.</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/recipes/new">Add your first recipe</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
}
