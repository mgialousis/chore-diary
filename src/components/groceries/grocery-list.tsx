"use client";

import { useEffect, useState, useTransition } from "react";
import { addDays } from "date-fns";
import { ShoppingCart, ChevronDown, ChevronUp, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { clearBoughtItems, generateGroceryList } from "@/actions/groceries";
import { Button } from "@/components/ui/button";
import { AggregatedGroceryItem, ManualGroceryItem } from "@/components/groceries/grocery-item";
import { AddGroceryForm } from "@/components/groceries/add-grocery-form";
import { toDateOnly } from "@/lib/date";
import { cn } from "@/lib/utils";
import type { GroceryItem } from "@prisma/client";
import type { AggregatedIngredient } from "@/actions/groceries";

const CATEGORY_ORDER = [
  "VEGETABLES", "FRUIT", "DAIRY", "MEAT_FISH", "PANTRY",
  "FROZEN", "CLEANING_SUPPLIES", "BATHROOM_SUPPLIES", "OTHER",
];

const CATEGORY_LABELS: Record<string, string> = {
  VEGETABLES: "Vegetables",
  FRUIT: "Fruit",
  DAIRY: "Dairy",
  MEAT_FISH: "Meat & Fish",
  PANTRY: "Pantry",
  FROZEN: "Frozen",
  CLEANING_SUPPLIES: "Cleaning Supplies",
  BATHROOM_SUPPLIES: "Bathroom Supplies",
  OTHER: "Other",
};

const DATE_RANGES = [
  { label: "Next 3 days", days: 3 },
  { label: "Next 7 days", days: 7 },
  { label: "Next 14 days", days: 14 },
];

function Section({
  title,
  children,
  count,
  description,
  tone = "default",
  action,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  count: number;
  description?: string;
  tone?: "default" | "warm" | "muted";
  action?: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  const toneClasses = {
    default: "bg-slate-50/80",
    warm: "bg-amber-50/80",
    muted: "bg-muted/50",
  };

  return (
    <div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
      <button
        className={cn(
          "w-full px-5 py-4 text-left transition-colors hover:bg-muted/40",
          toneClasses[tone],
        )}
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">{title}</span>
              <span className="rounded-full bg-background/80 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {count}
              </span>
            </div>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          {open ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
        </div>
      </button>
      {open && (
        <div className="space-y-4 p-4 md:p-5">
          {action}
          {children}
        </div>
      )}
    </div>
  );
}

export function GroceryList({
  manualItems,
  boughtItems,
  initialAggregated,
}: {
  manualItems: GroceryItem[];
  boughtItems: GroceryItem[];
  initialAggregated: AggregatedIngredient[];
}) {
  const [rangeDays, setRangeDays] = useState(7);
  const [aggregated, setAggregated] = useState<AggregatedIngredient[]>(initialAggregated);
  const [isRefreshing, startRefresh] = useTransition();
  const [isClearing, startClear] = useTransition();

  useEffect(() => {
    setAggregated(initialAggregated);
  }, [initialAggregated]);

  function handleRangeChange(days: number) {
    setRangeDays(days);
    startRefresh(async () => {
      const start = toDateOnly(new Date());
      const end = toDateOnly(addDays(start, days));
      const result = await generateGroceryList(start, end);
      setAggregated(result);
    });
  }

  function handleClearBought() {
    startClear(async () => {
      await clearBoughtItems();
      toast.success("Bought items cleared");
    });
  }

  // Group aggregated by category
  const byCategory = CATEGORY_ORDER.reduce<Record<string, AggregatedIngredient[]>>(
    (acc, cat) => {
      const items = aggregated.filter((i) => i.category === cat);
      if (items.length > 0) acc[cat] = items;
      return acc;
    },
    {},
  );

  const needingItems = manualItems.filter((i) => i.status === "NEEDED");

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border bg-gradient-to-r from-amber-50 via-background to-emerald-50 p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-amber-900">
              <Sparkles className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-[0.18em]">
                Meal-driven planning
              </span>
            </div>
            <h2 className="text-lg font-semibold tracking-tight">Build your list from upcoming meals</h2>
            <p className="text-sm text-muted-foreground">
              Switch the date range to pull ingredients from planned recipes.
            </p>
          </div>
          <div className="space-y-2">
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Show meals from
            </span>
            <div className="flex flex-wrap gap-2">
          {DATE_RANGES.map((r) => (
            <button
              key={r.days}
              onClick={() => handleRangeChange(r.days)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                rangeDays === r.days
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
              )}
            >
              {r.label}
            </button>
          ))}
            </div>
          </div>
        </div>
      </div>

      <Section
        title={`From Meal Plan${isRefreshing ? " (updating…)" : ""}`}
        count={aggregated.length}
        description="Auto-generated ingredients grouped by aisle to speed up shopping."
        tone="warm"
      >
        {Object.keys(byCategory).length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-background/80 p-8 text-center text-muted-foreground">
            <ShoppingCart className="mx-auto mb-2 h-8 w-8 opacity-40" />
            <p className="text-sm font-medium">No ingredients from your meal plan yet</p>
            <p className="mt-1 text-xs">Plan some meals with recipes to generate a grocery list.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {Object.entries(byCategory).map(([cat, items]) => (
              <div key={cat} className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {CATEGORY_LABELS[cat] ?? cat}
                </p>
                <div className="space-y-2">
                  {items.map((item, i) => (
                    <AggregatedGroceryItem key={`${item.normalizedName}-${i}`} item={item} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section
        title="Manual Items"
        count={needingItems.length}
        description="Add staples, snacks, and anything that is not tied to a planned recipe."
      >
        <AddGroceryForm />
        {needingItems.length === 0 ? (
          <p className="rounded-2xl border border-dashed bg-background/80 p-4 text-sm text-muted-foreground">
            Your grocery list is empty. Plan some meals or add items manually.
          </p>
        ) : (
          <div className="space-y-2">
            {needingItems.map((item) => (
              <ManualGroceryItem key={item.id} item={item} />
            ))}
          </div>
        )}
      </Section>

      {boughtItems.length > 0 && (
        <Section
          title="Bought"
          count={boughtItems.length}
          description="Recently purchased items stay here until you clear them."
          tone="muted"
          action={(
            <div className="flex items-center justify-end">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 rounded-full px-3 text-xs text-muted-foreground"
                onClick={handleClearBought}
                disabled={isClearing}
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                Clear all
              </Button>
            </div>
          )}
          defaultOpen={false}
        >
          <div className="space-y-2 opacity-70">
            {boughtItems.map((item) => (
              <ManualGroceryItem key={item.id} item={item} />
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
