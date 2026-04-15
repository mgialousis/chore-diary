"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { Search } from "lucide-react";
import { planMeal } from "@/actions/meals";
import { mealPlanSchema, type MealPlanFormValues } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MealSlot, Recipe, HouseholdMember, User } from "@prisma/client";

export function MealFormModal({
  open,
  onOpenChange,
  date,
  mealSlot,
  recipes,
  members,
  defaultValues,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date;
  mealSlot: MealSlot;
  recipes: Recipe[];
  members: (HouseholdMember & { user: User })[];
  defaultValues?: Partial<MealPlanFormValues>;
}) {
  const [mode, setMode] = useState<"recipe" | "custom">(
    defaultValues?.recipeId ? "recipe" : defaultValues?.customMealName ? "custom" : "recipe",
  );
  const [recipeSearch, setRecipeSearch] = useState("");
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(mediaQuery.matches);

    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  const form = useForm<MealPlanFormValues>({
    resolver: zodResolver(mealPlanSchema),
    defaultValues: {
      date,
      mealSlot,
      recipeId: null,
      customMealName: null,
      assignedUserId: null,
      servings: 2,
      notes: "",
      ...defaultValues,
    },
  });

  const selectedRecipeId = useWatch({
    control: form.control,
    name: "recipeId",
  });
  const assignedUserId = useWatch({
    control: form.control,
    name: "assignedUserId",
  });
  const selectedRecipe = recipes.find((r) => r.id === selectedRecipeId);

  const filteredRecipes = recipes.filter((r) =>
    r.name.toLowerCase().includes(recipeSearch.toLowerCase()),
  );

  async function onSubmit(data: MealPlanFormValues) {
    const result = await planMeal(data);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Meal saved");
      onOpenChange(false);
      form.reset();
    }
  }

  const formContent = (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      {/* Mode toggle */}
      <div className="grid grid-cols-2 rounded-xl border bg-muted/30 p-1">
        <button
          type="button"
          onClick={() => {
            setMode("recipe");
            form.setValue("customMealName", null);
          }}
          className={`flex-1 py-2 text-sm transition-colors ${
            mode === "recipe"
              ? "rounded-lg bg-primary text-primary-foreground shadow-sm"
              : "rounded-lg text-muted-foreground hover:bg-background"
          }`}
        >
          Choose recipe
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("custom");
            form.setValue("recipeId", null);
          }}
          className={`flex-1 py-2 text-sm transition-colors ${
            mode === "custom"
              ? "rounded-lg bg-primary text-primary-foreground shadow-sm"
              : "rounded-lg text-muted-foreground hover:bg-background"
          }`}
        >
          Custom meal
        </button>
      </div>

      {mode === "recipe" ? (
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search recipes..."
              className="pl-9"
              value={recipeSearch}
              onChange={(e) => setRecipeSearch(e.target.value)}
            />
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1 rounded-xl border bg-background p-1.5">
            {filteredRecipes.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No recipes found
              </p>
            ) : (
              filteredRecipes.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    form.setValue("recipeId", r.id);
                    form.setValue("servings", r.defaultServings);
                  }}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    selectedRecipeId === r.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  <span className="font-medium">{r.name}</span>
                  {r.prepTimeMinutes && (
                    <span className="ml-2 text-xs opacity-70">{r.prepTimeMinutes}m</span>
                  )}
                </button>
              ))
            )}
          </div>
          {form.formState.errors.customMealName && (
            <p className="text-xs text-destructive">
              {form.formState.errors.customMealName.message}
            </p>
          )}
          {selectedRecipe && (
            <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
              <p className="font-medium">{selectedRecipe.name}</p>
              <p className="text-muted-foreground">
                Default {selectedRecipe.defaultServings} servings
                {selectedRecipe.prepTimeMinutes ? ` • ${selectedRecipe.prepTimeMinutes} min` : ""}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-1.5">
          <Label>Meal name</Label>
          <Input
            placeholder="e.g. Leftover pasta"
            {...form.register("customMealName")}
          />
          {form.formState.errors.customMealName && (
            <p className="text-xs text-destructive">
              {form.formState.errors.customMealName.message}
            </p>
          )}
        </div>
      )}

      <div className="space-y-1.5">
        <Label>Servings</Label>
        <Input
          type="number"
          min={1}
          max={20}
          inputMode="numeric"
          {...form.register("servings", { valueAsNumber: true })}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Who&apos;s cooking?</Label>
        <Select
          value={assignedUserId ?? "anyone"}
          onValueChange={(v) =>
            form.setValue("assignedUserId", v === "anyone" ? null : v)
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="anyone">Anyone</SelectItem>
            {members.map((m) => (
              <SelectItem key={m.user.id} value={m.user.id}>
                {m.user.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Notes (optional)</Label>
        <Textarea
          rows={2}
          placeholder="Any notes..."
          {...form.register("notes")}
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting ? "Saving..." : "Save meal"}
      </Button>
    </form>
  );

  const title = (
    <>
      Plan {mealSlot === "LUNCH" ? "Lunch" : "Dinner"} —{" "}
      {format(date, "EEE, MMM d")}
    </>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl p-0">
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-6">{formContent}</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl px-4 pb-4 sm:px-6">
        <SheetHeader className="mb-4">
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        {formContent}
      </SheetContent>
    </Sheet>
  );
}
