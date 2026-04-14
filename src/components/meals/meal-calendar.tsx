"use client";

import { Fragment } from "react";
import { useRouter } from "next/navigation";
import { addWeeks, format, isToday, subWeeks } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MealSlotCell } from "@/components/meals/meal-slot";
import { toDateKey } from "@/lib/date";
import { cn } from "@/lib/utils";
import type { HouseholdMember, Recipe, User } from "@prisma/client";
import type { MealPlanWithDetails } from "@/types";

const SLOTS = ["LUNCH", "DINNER"] as const;
const SLOT_LABELS: Record<string, string> = { LUNCH: "Lunch", DINNER: "Dinner" };

export function MealCalendar({
  days,
  meals,
  weekStart,
  recipes,
  members,
}: {
  days: Date[];
  meals: MealPlanWithDetails[];
  weekStart: Date;
  recipes: Recipe[];
  members: (HouseholdMember & { user: User })[];
}) {
  const router = useRouter();

  function navigate(delta: -1 | 1) {
    const target = delta === 1 ? addWeeks(weekStart, 1) : subWeeks(weekStart, 1);
    router.push(`/meals?week=${format(target, "yyyy-MM-dd")}`);
  }

  function getMeal(date: Date, slot: string) {
    return meals.find(
      (meal) =>
        toDateKey(new Date(meal.date)) === toDateKey(date) &&
        meal.mealSlot === slot,
    ) as MealPlanWithDetails | undefined;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          <ChevronLeft className="mr-1 h-4 w-4" />
          Previous week
        </Button>
        <p className="text-sm font-medium">
          {format(days[0], "MMM d")} - {format(days[6], "MMM d, yyyy")}
        </p>
        <Button variant="outline" size="sm" onClick={() => navigate(1)}>
          Next week
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>

      <div className="hidden overflow-x-auto md:block">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-[4.5rem_repeat(7,minmax(0,1fr))] gap-2">
            <div />
            {days.map((day) => (
              <div
                key={day.toISOString()}
                className={cn(
                  "rounded px-2 py-1 text-center text-xs font-medium",
                  isToday(day) ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                )}
              >
                <div>{format(day, "EEE")}</div>
                <div className="text-sm font-semibold">{format(day, "d")}</div>
              </div>
            ))}

            {SLOTS.map((slot) => (
              <Fragment key={slot}>
                <div className="flex items-center justify-center rounded-lg border bg-muted/30 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {SLOT_LABELS[slot]}
                </div>
                {days.map((day) => (
                  <MealSlotCell
                    key={`${day.toISOString()}-${slot}`}
                    date={day}
                    slot={slot}
                    meal={getMeal(day, slot)}
                    recipes={recipes}
                    members={members}
                  />
                ))}
              </Fragment>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4 md:hidden">
        {days.map((day) => (
          <div
            key={day.toISOString()}
            className={cn(
              "space-y-2 rounded-xl border p-3",
              isToday(day) && "border-primary",
            )}
          >
            <p className={cn("text-sm font-semibold", isToday(day) && "text-primary")}>
              {format(day, "EEEE, MMM d")}
            </p>
            {SLOTS.map((slot) => (
              <div key={slot} className="space-y-1">
                <p className="text-xs text-muted-foreground">{SLOT_LABELS[slot]}</p>
                <MealSlotCell
                  date={day}
                  slot={slot}
                  meal={getMeal(day, slot)}
                  recipes={recipes}
                  members={members}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
