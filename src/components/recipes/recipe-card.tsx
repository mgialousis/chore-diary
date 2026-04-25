import Link from "next/link";
import { ArrowUpRight, Clock, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RecipeWithIngredients } from "@/types";

export function RecipeCard({ recipe }: { recipe: RecipeWithIngredients }) {
  return (
    <Link href={`/recipes/${recipe.id}`}>
      <Card className="group h-full cursor-pointer rounded-3xl border bg-card/95 transition-all hover:-translate-y-1 hover:shadow-lg">
        <CardHeader className="space-y-3 pb-2">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              {recipe.mealType && (
                <Badge variant="secondary" className="rounded-full bg-amber-100 px-2.5 py-0 text-[11px] text-amber-900">
                  {recipe.mealType === "LUNCH" ? "Lunch" : "Dinner"}
                </Badge>
              )}
              <CardTitle className="text-lg leading-tight tracking-tight">{recipe.name}</CardTitle>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full border bg-background text-muted-foreground transition-colors group-hover:text-foreground">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {recipe.description && (
            <p className="line-clamp-2 text-sm text-muted-foreground">{recipe.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium">
              <Users className="h-3.5 w-3.5" />
              {recipe.defaultServings}
            </span>
            {recipe.prepTimeMinutes && (
              <span className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium">
                <Clock className="h-3.5 w-3.5" />
                {recipe.prepTimeMinutes}m
              </span>
            )}
          </div>
          {recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {recipe.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="rounded-full border-border/80 text-[11px]">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
