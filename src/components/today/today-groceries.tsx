"use client";

import Link from "next/link";
import { useOptimistic, useTransition } from "react";
import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { markGroceryBought } from "@/actions/groceries";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { GroceryItemSummary } from "@/types";

function GroceryRow({ item }: { item: GroceryItemSummary }) {
  const [isPending, startTransition] = useTransition();
  const [checked, setChecked] = useOptimistic(item.checked);

  const quantity = Number.isInteger(item.quantity)
    ? item.quantity.toString()
    : item.quantity.toFixed(1);

  function handleToggle() {
    startTransition(async () => {
      setChecked(!checked);
      const result = await markGroceryBought(item.id) as { error?: string } | void;
      if (result?.error) {
        toast.error(result.error);
        setChecked(false);
      } else {
        toast.success("Item marked as bought");
      }
    });
  }

  return (
    <div className={cn("flex items-start gap-3 py-2.5", isPending && "opacity-60")}>
      <Checkbox checked={checked} onCheckedChange={handleToggle} className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-medium", checked && "text-muted-foreground line-through")}>
          {quantity} {item.unit ?? ""} {item.name}
        </p>
      </div>
    </div>
  );
}

export function TodayGroceries({ items }: { items: GroceryItemSummary[] }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-semibold">Grocery Snapshot</h2>
        </div>
        <Link href="/groceries" className="text-sm text-primary hover:underline">
          See full list
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
          No grocery items right now.
        </div>
      ) : (
        <div className="rounded-xl border px-3">
          {items.map((item) => (
            <GroceryRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}
