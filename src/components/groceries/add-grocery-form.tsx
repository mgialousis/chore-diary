"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { PackagePlus, Plus } from "lucide-react";
import { addManualGroceryItem } from "@/actions/groceries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IngredientNameInput } from "@/components/shared/ingredient-name-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  quantity: z.number().positive(),
  unit: z.string().nullable(),
  category: z.enum([
    "VEGETABLES", "FRUIT", "DAIRY", "MEAT_FISH", "PANTRY",
    "FROZEN", "CLEANING_SUPPLIES", "BATHROOM_SUPPLIES", "OTHER",
  ]),
});

type FormValues = z.infer<typeof schema>;

const UNITS = ["piece", "g", "kg", "ml", "l", "tsp", "tbsp", "cup", "can", "bunch", "slice"];

const CATEGORIES = [
  { value: "VEGETABLES", label: "Vegetables" },
  { value: "FRUIT", label: "Fruit" },
  { value: "DAIRY", label: "Dairy" },
  { value: "MEAT_FISH", label: "Meat & Fish" },
  { value: "PANTRY", label: "Pantry" },
  { value: "FROZEN", label: "Frozen" },
  { value: "CLEANING_SUPPLIES", label: "Cleaning" },
  { value: "BATHROOM_SUPPLIES", label: "Bathroom" },
  { value: "OTHER", label: "Other" },
];

export function AddGroceryForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", quantity: 1, unit: null, category: "OTHER" },
  });
  const nameValue = useWatch({ control: form.control, name: "name" });
  const selectedUnit = useWatch({ control: form.control, name: "unit" });
  const selectedCategory = useWatch({ control: form.control, name: "category" });

  async function onSubmit(data: FormValues) {
    const result = await addManualGroceryItem(data) as { error?: string } | undefined;
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Item added to grocery list");
      form.reset({ name: "", quantity: 1, unit: null, category: "OTHER" });
    }
  }

  return (
    <div className="rounded-2xl border bg-card/80 p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
          <PackagePlus className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold">Add a manual item</p>
          <p className="text-xs text-muted-foreground">
            Keep track of staples and last-minute needs.
          </p>
        </div>
      </div>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid gap-3 md:grid-cols-[minmax(0,1.9fr)_110px_120px_160px_auto]"
      >
        <IngredientNameInput
          value={nameValue ?? ""}
          onChange={(value) => form.setValue("name", value, { shouldValidate: true, shouldDirty: true })}
          placeholder="Item name..."
          className="min-w-0"
          onEnter={() => form.handleSubmit(onSubmit)()}
        />
        <Input
          type="number"
          min={0.1}
          step={0.1}
          className="h-11"
          inputMode="decimal"
          {...form.register("quantity", { valueAsNumber: true })}
        />
        <Select
          value={selectedUnit ?? "piece"}
          onValueChange={(v) => form.setValue("unit", v === "piece" ? null : v)}
        >
          <SelectTrigger className="h-11">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {UNITS.map((u) => (
              <SelectItem key={u} value={u}>{u}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={selectedCategory}
          onValueChange={(v) => form.setValue("category", v as FormValues["category"])}
        >
          <SelectTrigger className="h-11">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit" disabled={form.formState.isSubmitting} className="h-11 px-5">
          <Plus className="mr-1 h-4 w-4" />
          Add
        </Button>
      </form>
    </div>
  );
}
