"use client";

import { useEffect, useRef, useState } from "react";
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
import { getIngredientSuggestions } from "@/actions/recipes";
import type { UseFormReturn } from "react-hook-form";
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
  householdId,
  onRemove,
}: {
  index: number;
  form: UseFormReturn<RecipeFormValues>;
  householdId: string;
  onRemove: () => void;
}) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const nameValue = form.watch(`ingredients.${index}.ingredientName`);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!nameValue || nameValue.length < 1) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const results = await getIngredientSuggestions(nameValue, householdId);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [nameValue, householdId]);

  // Close suggestions on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

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
        value={form.watch(`ingredients.${index}.unit`) ?? "taste"}
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
      <div ref={containerRef} className="relative flex-1">
        <Input
          placeholder="Ingredient name"
          autoComplete="off"
          {...form.register(`ingredients.${index}.ingredientName`)}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        />
        {showSuggestions && (
          <ul className="absolute z-50 top-full mt-1 w-full rounded-md border bg-popover shadow-md">
            {suggestions.map((s) => (
              <li key={s}>
                <button
                  type="button"
                  className="w-full px-3 py-1.5 text-left text-sm hover:bg-accent"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    form.setValue(`ingredients.${index}.ingredientName`, s);
                    setShowSuggestions(false);
                  }}
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

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
