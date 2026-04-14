"use client";

import { Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { IngredientNameInput } from "@/components/shared/ingredient-name-input";
import { useWatch, type UseFormReturn } from "react-hook-form";
import type { RecipeFormValues } from "@/types";

const UNITS = [
  { value: "g", label: "g" },
  { value: "kg", label: "kg" },
  { value: "ml", label: "ml" },
  { value: "l", label: "l" },
  { value: "tsp", label: "tsp" },
  { value: "tbsp", label: "tbsp" },
  { value: "cup", label: "cup" },
  { value: "piece", label: "piece" },
  { value: "can", label: "can" },
  { value: "bunch", label: "bunch" },
  { value: "clove", label: "clove" },
  { value: "slice", label: "slice" },
];

export function IngredientInput({
  index,
  form,
  onRemove,
}: {
  index: number;
  form: UseFormReturn<RecipeFormValues>;
  onRemove: () => void;
}) {
  const nameValue = useWatch({
    control: form.control,
    name: `ingredients.${index}.ingredientName`,
  });
  const unitValue = useWatch({
    control: form.control,
    name: `ingredients.${index}.unit`,
  });

  return (
    <div className="flex items-start gap-2">
      {/* Quantity */}
      <Input
        type="number"
        min="0"
        step="any"
        placeholder="Qty"
        className="w-20 shrink-0"
        inputMode="decimal"
        {...form.register(`ingredients.${index}.quantity`, { valueAsNumber: true })}
      />

      {/* Unit */}
      <Select
        value={unitValue ?? "taste"}
        onValueChange={(v) =>
          form.setValue(`ingredients.${index}.unit`, v === "taste" ? null : v)
        }
      >
        <SelectTrigger className="w-24 shrink-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="taste">to taste</SelectItem>
          {UNITS.map((u) => (
            <SelectItem key={u.value} value={u.value}>
              {u.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Name with autocomplete */}
      <IngredientNameInput
        value={nameValue ?? ""}
        onChange={(value) => form.setValue(`ingredients.${index}.ingredientName`, value, {
          shouldDirty: true,
          shouldValidate: true,
        })}
        placeholder="Ingredient name"
        className="flex-1"
      />

      {/* Remove */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
        onClick={onRemove}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
