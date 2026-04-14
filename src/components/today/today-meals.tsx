"use client";

import { useTransition } from "react";
import { UtensilsCrossed, Check, Plus } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { format } from "date-fns";
import { markMealCooked } from "@/actions/meals";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { MealPlanWithDetails } from "@/types";

function MealCard({ meal }: { meal: MealPlanWithDetails }) {
  const [isPending, startTransition] = useTransition();
  const isCooked = meal.status === "COOKED";
  const mealName = meal.recipe?.name ?? meal.customMealName ?? "Meal";

  function handleCooked() {
    startTransition(async () => {
      const result = await markMealCooked(meal.id) as { error?: string } | undefined;
      if (result?.error) toast.error(result.error);
      else toast.success("Meal marked as cooked");
    });
  }

  return (
    <div
      className={cn(
        "rounded-lg border p-3 space-y-1.5 transition-all",
        isCooked && "border-green-200 bg-green-50/60",
        isPending && "opacity-60",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-tight">{mealName}</p>
        {isCooked && <Check className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />}
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs text-muted-foreground">{meal.servings} srv</span>
        {meal.assignedTo && (
          <Badge variant="outline" className="text-xs py-0">
            {meal.assignedTo.name.split(" ")[0]}
          </Badge>
        )}
        {isCooked && (
          <Badge className="text-xs py-0 bg-green-100 text-green-800 border-green-200">
            Cooked
          </Badge>
        )}
      </div>
      {!isCooked && (
        <Button
          size="sm"
          variant="ghost"
          className="h-6 px-2 text-xs text-green-700 hover:bg-green-100 -ml-1"
          onClick={handleCooked}
          disabled={isPending}
        >
          <Check className="h-3 w-3 mr-1" />
          Mark cooked
        </Button>
      )}
    </div>
  );
}

function EmptySlot({ slot }: { slot: "LUNCH" | "DINNER" }) {
  const today = format(new Date(), "yyyy-MM-dd");
  return (
    <Link
      href={`/meals?week=${today}`}
      className="flex items-center justify-center rounded-lg border border-dashed p-4 text-muted-foreground hover:bg-muted/50 transition-colors min-h-[5rem]"
    >
      <Plus className="h-4 w-4 mr-1.5" />
      <span className="text-sm">Plan {slot === "LUNCH" ? "lunch" : "dinner"}</span>
    </Link>
  );
}

export function TodayMeals({
  meals,
}: {
  meals: MealPlanWithDetails[];
}) {
  const lunch = meals.find((m) => m.mealSlot === "LUNCH");
  const dinner = meals.find((m) => m.mealSlot === "DINNER");

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <UtensilsCrossed className="h-5 w-5 text-muted-foreground" />
        <h2 className="font-semibold">Today&apos;s Meals</h2>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-medium">Lunch</p>
          {lunch ? <MealCard meal={lunch} /> : <EmptySlot slot="LUNCH" />}
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-medium">Dinner</p>
          {dinner ? <MealCard meal={dinner} /> : <EmptySlot slot="DINNER" />}
        </div>
      </div>
    </section>
  );
}
