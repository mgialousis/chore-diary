"use client";

import { useTransition } from "react";
import { Trash2, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  toggleGroceryItemChecked,
  markGroceryBought,
  deleteGroceryItem,
  markAggregatedIngredientBought,
} from "@/actions/groceries";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { GroceryItem } from "@prisma/client";
import type { AggregatedIngredient } from "@/actions/groceries";

const CATEGORY_LABELS: Record<string, string> = {
  VEGETABLES: "Vegetables",
  FRUIT: "Fruit",
  DAIRY: "Dairy",
  MEAT_FISH: "Meat & Fish",
  PANTRY: "Pantry",
  FROZEN: "Frozen",
  CLEANING_SUPPLIES: "Cleaning",
  BATHROOM_SUPPLIES: "Bathroom",
  OTHER: "Other",
};

// ─── Auto-generated (aggregated) item ────────────────────────

export function AggregatedGroceryItem({ item }: { item: AggregatedIngredient }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const qty = Number.isInteger(item.quantity)
    ? item.quantity.toString()
    : item.quantity.toFixed(1);

  function handleBought() {
    startTransition(async () => {
      const result = await markAggregatedIngredientBought(item) as { error?: string } | undefined;
      if (result?.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Item marked as bought");
      router.refresh();
    });
  }

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-2xl border bg-background/80 px-4 py-3 shadow-sm transition-opacity",
        isPending && "opacity-60",
      )}
    >
      <Checkbox
        checked={false}
        onCheckedChange={handleBought}
        className="mt-1 shrink-0"
        disabled={isPending}
        aria-label={`Mark ${item.name} as bought`}
      />
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm font-semibold text-foreground">
          {qty} {item.unit ?? ""} {item.name}
        </p>
        <Badge
          variant="outline"
          className="border-amber-200 bg-amber-50 px-2 py-0 text-[11px] text-amber-900"
        >
          {CATEGORY_LABELS[item.category] ?? item.category}
        </Badge>
        {item.sources.length > 0 && (
          <p className="text-xs text-muted-foreground">
            From: {item.sources.join(", ")}
          </p>
        )}
      </div>
      <Button
        size="sm"
        variant="outline"
        className="h-9 rounded-full border-emerald-200 bg-emerald-50 px-3 text-xs font-medium text-emerald-800 hover:bg-emerald-100"
        onClick={handleBought}
        disabled={isPending}
      >
        <ShoppingCart className="mr-1 h-3.5 w-3.5" />
        Bought
      </Button>
    </div>
  );
}

// ─── Manual (stored) item ─────────────────────────────────────

export function ManualGroceryItem({ item }: { item: GroceryItem }) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      await toggleGroceryItemChecked(item.id);
    });
  }

  function handleBought() {
    startTransition(async () => {
      await markGroceryBought(item.id);
      toast.success("Item marked as bought");
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteGroceryItem(item.id);
      toast.success("Item removed from grocery list");
    });
  }

  const qty = Number.isInteger(item.quantity)
    ? item.quantity.toString()
    : item.quantity.toFixed(1);

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border bg-background/80 px-4 py-3 shadow-sm transition-opacity sm:flex-row sm:items-start",
        isPending && "opacity-60",
      )}
    >
      <Checkbox
        checked={item.checked}
        onCheckedChange={handleToggle}
        className="mt-1 shrink-0"
      />
      <div className="min-w-0 flex-1 space-y-1">
        <p className={cn("text-sm font-semibold", item.checked && "line-through text-muted-foreground")}>
          {qty} {item.unit ?? ""} {item.name}
        </p>
        <Badge
          variant="outline"
          className="border-slate-200 bg-slate-50 px-2 py-0 text-[11px] text-slate-700"
        >
          {CATEGORY_LABELS[item.category] ?? item.category}
        </Badge>
      </div>
      <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
        {!item.checked && (
          <Button
            size="sm"
            variant="outline"
            className="h-9 rounded-full border-emerald-200 bg-emerald-50 px-3 text-xs font-medium text-emerald-800 hover:bg-emerald-100"
            onClick={handleBought}
            disabled={isPending}
          >
            <ShoppingCart className="mr-1 h-3.5 w-3.5" />
            Bought
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="h-9 w-9 rounded-full text-destructive hover:bg-destructive/10"
          onClick={handleDelete}
          disabled={isPending}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
