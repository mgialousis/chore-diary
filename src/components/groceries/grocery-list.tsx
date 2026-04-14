"use client";

import { useState, useTransition } from "react";
import { addDays } from "date-fns";
import { ShoppingCart, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
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
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  count: number;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/40 hover:bg-muted/60 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span className="text-sm font-semibold">
          {title}
          <span className="ml-2 text-xs font-normal text-muted-foreground">({count})</span>
        </span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && <div className="px-4 divide-y">{children}</div>}
    </div>
  );
}

export function GroceryList({
  householdId,
  manualItems,
  boughtItems,
  initialAggregated,
}: {
  householdId: string;
  manualItems: GroceryItem[];
  boughtItems: GroceryItem[];
  initialAggregated: AggregatedIngredient[];
}) {
  const [rangeDays, setRangeDays] = useState(7);
  const [aggregated, setAggregated] = useState<AggregatedIngredient[]>(initialAggregated);
  const [isRefreshing, startRefresh] = useTransition();
  const [isClearing, startClear] = useTransition();

  function handleRangeChange(days: number) {
    setRangeDays(days);
    startRefresh(async () => {
      const start = toDateOnly(new Date());
      const end = toDateOnly(addDays(start, days));
      const result = await generateGroceryList(householdId, start, end);
      setAggregated(result);
    });
  }

  function handleClearBought() {
    startClear(async () => {
      await clearBoughtItems();
      toast.success("Cleared bought items");
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
    <div className="space-y-4">
      {/* Date range selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Show meals from:</span>
        <div className="flex gap-1">
          {DATE_RANGES.map((r) => (
            <button
              key={r.days}
              onClick={() => handleRangeChange(r.days)}
              className={cn(
                "px-3 py-1 text-xs rounded-full border transition-colors",
                rangeDays === r.days
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-muted-foreground/30 hover:bg-muted",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <Section
        title={`From Meal Plan${isRefreshing ? " (updating…)" : ""}`}
        count={aggregated.length}
      >
        {Object.keys(byCategory).length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
            <ShoppingCart className="mx-auto mb-2 h-8 w-8 opacity-40" />
            <p className="text-sm font-medium">No ingredients from meal plan</p>
            <p className="mt-1 text-xs">Plan some meals with recipes to generate a grocery list.</p>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {Object.entries(byCategory).map(([cat, items]) => (
              <div key={cat} className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {CATEGORY_LABELS[cat] ?? cat}
                </p>
                <div className="rounded-xl border divide-y">
                  {items.map((item, i) => (
                    <div key={`${item.normalizedName}-${i}`} className="px-4">
                      <AggregatedGroceryItem item={item} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Manual Items" count={needingItems.length}>
        <AddGroceryForm />
        {needingItems.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">No manual items added.</p>
        ) : (
          <div className="rounded-xl border divide-y px-4">
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
          defaultOpen={false}
        >
          <div className="flex items-center justify-end py-3">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-muted-foreground"
              onClick={handleClearBought}
              disabled={isClearing}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Clear all
            </Button>
          </div>
          <div className="rounded-xl border divide-y px-4 opacity-60">
            {boughtItems.map((item) => (
              <ManualGroceryItem key={item.id} item={item} />
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
