import Link from "next/link";
import { Clock, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RecipeWithIngredients } from "@/types";

export function RecipeCard({ recipe }: { recipe: RecipeWithIngredients }) {
  return (
    <Link href={`/recipes/${recipe.id}`}>
      <Card className="h-full transition-shadow hover:shadow-md cursor-pointer">
        <CardHeader className="pb-2">
          <CardTitle className="text-base leading-tight">{recipe.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {recipe.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{recipe.description}</p>
          )}
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {recipe.defaultServings}
            </span>
            {recipe.prepTimeMinutes && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {recipe.prepTimeMinutes}m
              </span>
            )}
            {recipe.mealType && (
              <Badge variant="secondary" className="text-xs">
                {recipe.mealType === "LUNCH" ? "Lunch" : "Dinner"}
              </Badge>
            )}
          </div>
          {recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {recipe.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
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
