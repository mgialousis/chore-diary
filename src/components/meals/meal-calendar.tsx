"use client";

import { Fragment } from "react";
import { useRouter } from "next/navigation";
import { addWeeks, format, isToday, subWeeks } from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight, Soup, Sunset } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MealSlotCell } from "@/components/meals/meal-slot";
import { toDateKey } from "@/lib/date";
import { cn } from "@/lib/utils";
import type { HouseholdMember, Recipe, User } from "@prisma/client";
import type { MealPlanWithDetails } from "@/types";

const SLOTS = ["LUNCH", "DINNER"] as const;
const SLOT_LABELS: Record<string, string> = { LUNCH: "Lunch", DINNER: "Dinner" };
const SLOT_META = {
  LUNCH: {
    icon: Soup,
    eyebrow: "Midday",
  },
  DINNER: {
    icon: Sunset,
    eyebrow: "Evening",
  },
} as const;

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
    <div className="space-y-5">
      <div className="rounded-3xl border bg-gradient-to-r from-amber-50 via-white to-emerald-50 p-4 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-foreground text-background shadow-sm">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Week overview
              </p>
              <p className="text-lg font-semibold tracking-tight">
                {format(days[0], "MMM d")} - {format(days[6], "MMM d, yyyy")}
              </p>
              <p className="text-sm text-muted-foreground">
                Map out lunches and dinners, then adjust the week as plans change.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 md:justify-end">
            <Button variant="outline" size="sm" className="rounded-full" onClick={() => navigate(-1)}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous week
            </Button>
            <Button variant="outline" size="sm" className="rounded-full" onClick={() => navigate(1)}>
              Next week
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="hidden overflow-x-auto md:block">
        <div className="min-w-[860px] rounded-[28px] border bg-card/80 p-3 shadow-sm">
          <div className="grid grid-cols-[5.5rem_repeat(7,minmax(0,1fr))] gap-3">
            <div />
            {days.map((day) => (
              <div
                key={day.toISOString()}
                className={cn(
                  "rounded-2xl border px-2 py-3 text-center transition-colors",
                  isToday(day)
                    ? "border-foreground bg-foreground text-background shadow-sm"
                    : "border-transparent bg-muted/35 text-muted-foreground",
                )}
              >
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em]">
                  {format(day, "EEE")}
                </div>
                <div className="mt-1 text-lg font-semibold">{format(day, "d")}</div>
              </div>
            ))}

            {SLOTS.map((slot) => (
              <Fragment key={slot}>
                <div className="flex min-h-[6.75rem] flex-col items-start justify-between rounded-2xl border bg-muted/25 px-3 py-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-background text-foreground shadow-sm">
                    {(() => {
                      const Icon = SLOT_META[slot].icon;
                      return <Icon className="h-4 w-4" />;
                    })()}
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      {SLOT_META[slot].eyebrow}
                    </p>
                    <p className="text-sm font-semibold">{SLOT_LABELS[slot]}</p>
                  </div>
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
              "space-y-3 rounded-2xl border bg-card/80 p-4 shadow-sm",
              isToday(day) && "border-foreground/70 bg-muted/20",
            )}
          >
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {isToday(day) ? "Today" : format(day, "EEEE")}
              </p>
              <p className={cn("text-base font-semibold", isToday(day) && "text-foreground")}>
                {format(day, "MMMM d")}
              </p>
            </div>
            {SLOTS.map((slot) => (
              <div key={slot} className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {(() => {
                    const Icon = SLOT_META[slot].icon;
                    return <Icon className="h-3.5 w-3.5" />;
                  })()}
                  <span className="font-medium">{SLOT_LABELS[slot]}</span>
                </div>
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
