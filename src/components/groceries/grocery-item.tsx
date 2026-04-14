"use client";

import { useOptimistic, useTransition } from "react";
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
  const [optimisticBought, setOptimisticBought] = useOptimistic(false);
  const qty = Number.isInteger(item.quantity)
    ? item.quantity.toString()
    : item.quantity.toFixed(1);

  function handleBought() {
    startTransition(async () => {
      setOptimisticBought(true);
      const result = await markAggregatedIngredientBought(item) as { error?: string } | undefined;
      if (result?.error) {
        setOptimisticBought(false);
        toast.error(result.error);
        return;
      }

      toast.success("Item marked as bought");
      router.refresh();
    });
  }

  if (optimisticBought) return null;

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
  const [optimisticChecked, setOptimisticChecked] = useOptimistic(item.checked);
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(item.status);
  const [optimisticDeleted, setOptimisticDeleted] = useOptimistic(false);

  function handleToggle() {
    startTransition(async () => {
      const nextChecked = !optimisticChecked;
      const nextStatus = optimisticStatus === "BOUGHT" && !nextChecked ? "NEEDED" : optimisticStatus;
      setOptimisticChecked(nextChecked);
      setOptimisticStatus(nextStatus);
      const result = await toggleGroceryItemChecked(item.id) as { error?: string } | undefined;
      if (result?.error) {
        setOptimisticChecked(item.checked);
        setOptimisticStatus(item.status);
        toast.error(result.error);
      }
    });
  }

  function handleBought() {
    startTransition(async () => {
      setOptimisticChecked(true);
      setOptimisticStatus("BOUGHT");
      const result = await markGroceryBought(item.id) as { error?: string } | undefined;
      if (result?.error) {
        setOptimisticChecked(item.checked);
        setOptimisticStatus(item.status);
        toast.error(result.error);
      } else {
        toast.success("Item marked as bought");
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      setOptimisticDeleted(true);
      const result = await deleteGroceryItem(item.id) as { error?: string } | undefined;
      if (result?.error) {
        setOptimisticDeleted(false);
        toast.error(result.error);
      } else {
        toast.success("Item removed from grocery list");
      }
    });
  }

  if (optimisticDeleted) return null;

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
        checked={optimisticChecked}
        onCheckedChange={handleToggle}
        className="mt-1 shrink-0"
      />
      <div className="min-w-0 flex-1 space-y-1">
        <p className={cn("text-sm font-semibold", optimisticChecked && "line-through text-muted-foreground")}>
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
        {optimisticStatus !== "BOUGHT" && !optimisticChecked && (
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
