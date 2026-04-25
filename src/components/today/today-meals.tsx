"use client";

import { useOptimistic, useTransition } from "react";
import { UtensilsCrossed, Check, Plus } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { format } from "date-fns";
import { markMealCooked } from "@/actions/meals";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getUserColorOption } from "@/lib/user-colors";
import type { MealPlanWithDetails } from "@/types";

function MealCard({ meal }: { meal: MealPlanWithDetails }) {
  const [isPending, startTransition] = useTransition();
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(meal.status);
  const isCooked = optimisticStatus === "COOKED";
  const mealName = meal.recipe?.name ?? meal.customMealName ?? "Meal";
  const assignedUserColors = meal.assignedTo
    ? getUserColorOption(meal.assignedTo.id, meal.assignedTo.colorPreference)
    : null;

  function handleCooked() {
    startTransition(async () => {
      setOptimisticStatus("COOKED");
      const result = await markMealCooked(meal.id) as { error?: string } | undefined;
      if (result?.error) {
        setOptimisticStatus(meal.status);
        toast.error(result.error);
      } else toast.success("Meal marked as cooked");
    });
  }

  return (
    <div
      className={cn(
        "space-y-2 rounded-2xl border bg-card/95 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
        isCooked && "border-emerald-200 bg-emerald-50/70",
        isPending && "opacity-60",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold leading-tight tracking-tight">{mealName}</p>
        {isCooked && <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          {meal.servings} srv
        </span>
        {meal.assignedTo && assignedUserColors && (
          <Badge
            variant="outline"
            className={cn("rounded-full py-0 text-[11px]", assignedUserColors.pill)}
          >
            {meal.assignedTo.name.split(" ")[0]}
          </Badge>
        )}
        {isCooked && (
          <Badge className="rounded-full border-emerald-200 bg-emerald-100 py-0 text-[11px] text-emerald-800">
            Cooked
          </Badge>
        )}
      </div>
      {!isCooked && (
        <Button
          size="sm"
          variant="ghost"
          className="-ml-1 h-7 rounded-full px-2.5 text-[11px] text-emerald-700 hover:bg-emerald-100"
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
      className="flex min-h-[7rem] items-center justify-center rounded-2xl border border-dashed bg-background/60 p-4 text-muted-foreground transition-colors hover:border-foreground/30 hover:bg-muted/40"
    >
      <div className="flex flex-col items-center gap-1.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-full border bg-background shadow-sm">
          <Plus className="h-4 w-4" />
        </div>
        <span className="text-sm font-medium">Plan {slot === "LUNCH" ? "lunch" : "dinner"}</span>
      </div>
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
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <UtensilsCrossed className="h-5 w-5 text-muted-foreground" />
        <h2 className="font-semibold">Today&apos;s Meals</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 rounded-3xl border bg-gradient-to-br from-amber-50/70 to-background p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Lunch</p>
          {lunch ? <MealCard meal={lunch} /> : <EmptySlot slot="LUNCH" />}
        </div>
        <div className="space-y-2 rounded-3xl border bg-gradient-to-br from-sky-50/70 to-background p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Dinner</p>
          {dinner ? <MealCard meal={dinner} /> : <EmptySlot slot="DINNER" />}
        </div>
      </div>
    </section>
  );
}
