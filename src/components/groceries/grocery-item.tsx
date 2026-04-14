"use client";

import { useTransition } from "react";
import { Trash2, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { toggleGroceryItemChecked, markGroceryBought, deleteGroceryItem } from "@/actions/groceries";
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
  const qty = Number.isInteger(item.quantity)
    ? item.quantity.toString()
    : item.quantity.toFixed(1);

  return (
    <div className="flex items-start gap-3 py-2">
      <div className="mt-0.5 h-4 w-4 rounded border border-muted-foreground/30 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">
          {qty} {item.unit ?? ""} {item.name}
        </p>
        <Badge variant="outline" className="mt-0.5 text-xs py-0">
          {CATEGORY_LABELS[item.category] ?? item.category}
        </Badge>
        {item.sources.length > 0 && (
          <p className="text-xs text-muted-foreground truncate">
            From: {item.sources.join(", ")}
          </p>
        )}
      </div>
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
      toast.success(`Marked ${item.name} as bought`);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteGroceryItem(item.id);
      toast.success("Item removed");
    });
  }

  const qty = Number.isInteger(item.quantity)
    ? item.quantity.toString()
    : item.quantity.toFixed(1);

  return (
    <div
      className={cn(
        "flex items-start gap-3 py-2 transition-opacity",
        isPending && "opacity-60",
      )}
    >
      <Checkbox
        checked={item.checked}
        onCheckedChange={handleToggle}
        className="mt-0.5 shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium", item.checked && "line-through text-muted-foreground")}>
          {qty} {item.unit ?? ""} {item.name}
        </p>
        <Badge variant="outline" className="text-xs py-0 mt-0.5">
          {CATEGORY_LABELS[item.category] ?? item.category}
        </Badge>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {!item.checked && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs text-green-700 hover:bg-green-50"
            onClick={handleBought}
            disabled={isPending}
          >
            <ShoppingCart className="h-3.5 w-3.5 mr-1" />
            Bought
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-destructive hover:bg-destructive/10"
          onClick={handleDelete}
          disabled={isPending}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
