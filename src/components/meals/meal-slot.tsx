"use client";

import { useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { addDays, format, parseISO } from "date-fns";
import { Check, Copy, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { duplicateMeal, markMealCooked, removeMeal } from "@/actions/meals";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MealFormModal } from "@/components/meals/meal-form-modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getUserColorOption } from "@/lib/user-colors";
import type { HouseholdMember, MealSlot as MealSlotEnum, Recipe, User } from "@prisma/client";
import type { MealPlanFormValues, MealPlanWithDetails } from "@/types";

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function MealSlotCell({
  date,
  slot,
  meal,
  recipes,
  members,
}: {
  date: Date;
  slot: MealSlotEnum;
  meal: MealPlanWithDetails | undefined;
  recipes: Recipe[];
  members: (HouseholdMember & { user: User })[];
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [duplicateDate, setDuplicateDate] = useState(format(addDays(date, 1), "yyyy-MM-dd"));
  const [duplicateSlot, setDuplicateSlot] = useState<MealSlotEnum>(slot);
  const [isPending, startTransition] = useTransition();
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(meal?.status ?? null);
  const [optimisticRemoved, setOptimisticRemoved] = useOptimistic(false);

  function handleCooked() {
    if (!meal) return;

    startTransition(async () => {
      setOptimisticStatus("COOKED");
      const result = await markMealCooked(meal.id) as { error?: string } | undefined;
      if (result?.error) {
        setOptimisticStatus(meal.status);
        toast.error(result.error);
      } else {
        toast.success("Meal marked as cooked");
      }
    });
  }

  function handleRemove() {
    if (!meal) return;

    startTransition(async () => {
      setOptimisticRemoved(true);
      const result = await removeMeal(meal.id) as { error?: string } | undefined;
      if (result?.error) {
        setOptimisticRemoved(false);
        toast.error(result.error);
      } else {
        toast.success("Meal removed");
      }
    });
  }

  function handleDuplicate(targetDate: Date, targetSlot: MealSlotEnum) {
    if (!meal) return;

    startTransition(async () => {
      const result = await duplicateMeal(meal.id, targetDate, targetSlot);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Meal duplicated");
        setDuplicateOpen(false);
      }
    });
  }

  function openDuplicateDialog() {
    setDuplicateDate(format(addDays(date, 1), "yyyy-MM-dd"));
    setDuplicateSlot(slot);
    setDuplicateOpen(true);
  }

  const editDefaults: Partial<MealPlanFormValues> | undefined = meal
    ? {
        date,
        mealSlot: slot,
        recipeId: meal.recipeId,
        customMealName: meal.customMealName,
        assignedUserId: meal.assignedUserId,
        servings: meal.servings,
        notes: meal.notes ?? "",
      }
    : undefined;

  if (!meal || optimisticRemoved) {
    return (
      <>
        <button
          onClick={() => setModalOpen(true)}
          className="group flex h-full min-h-[6.75rem] w-full flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-border/80 bg-background/60 text-muted-foreground transition-all hover:border-foreground/30 hover:bg-muted/30"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full border bg-background shadow-sm transition-transform group-hover:scale-105">
            <Plus className="h-4 w-4" />
          </div>
          <span className="text-xs font-medium">{slot === "LUNCH" ? "Add lunch" : "Add dinner"}</span>
        </button>
        <MealFormModal
          key={`${date.toISOString()}-${slot}-${modalOpen ? "open" : "closed"}-new`}
          open={modalOpen}
          onOpenChange={setModalOpen}
          date={date}
          mealSlot={slot}
          recipes={recipes}
          members={members}
        />
      </>
    );
  }

  const mealName = meal.recipe?.name ?? meal.customMealName ?? "Meal";
  const isCooked = optimisticStatus === "COOKED";
  const assignedUserColors = meal.assignedTo
    ? getUserColorOption(meal.assignedTo.id, meal.assignedTo.colorPreference)
    : null;

  return (
    <>
      <div
        className={cn(
          "relative flex min-h-[6.75rem] flex-col gap-2 rounded-2xl border bg-card/95 p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
          isCooked && "border-emerald-200 bg-emerald-50/70",
          !isCooked && "border-border/80",
          isPending && "opacity-60",
        )}
      >
        {isCooked && (
          <div className="absolute right-2 top-2">
            <Check className="h-3.5 w-3.5 text-emerald-600" />
          </div>
        )}

        {meal.recipe ? (
          <Link
            href={`/recipes/${meal.recipe.id}`}
            className="line-clamp-2 pr-5 text-sm font-semibold leading-tight tracking-tight underline-offset-4 hover:underline"
          >
            {mealName}
          </Link>
        ) : (
          <p className="line-clamp-2 pr-5 text-sm font-semibold leading-tight tracking-tight">{mealName}</p>
        )}

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            {meal.servings} srv
          </span>
          {meal.assignedTo && assignedUserColors && (
            <div
              className={cn(
                "flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[11px]",
                assignedUserColors.pill,
              )}
            >
              <div
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold",
                  assignedUserColors.avatar,
                )}
              >
                {getInitials(meal.assignedTo.name)}
              </div>
              <span>{meal.assignedTo.name.split(" ")[0]}</span>
            </div>
          )}
          {!isCooked && (
            <Badge variant="secondary" className="rounded-full bg-slate-100 py-0 text-[11px] text-slate-700">
              Planned
            </Badge>
          )}
          {isCooked && (
            <Badge variant="secondary" className="rounded-full bg-emerald-100 py-0 text-[11px] text-emerald-800">
              Cooked
            </Badge>
          )}
        </div>

        <div className="mt-auto flex items-center gap-1">
          {!isCooked && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 rounded-full px-2.5 text-[11px] text-emerald-700 hover:bg-emerald-100"
              onClick={handleCooked}
              disabled={isPending}
            >
              <Check className="mr-1 h-3 w-3" />
              Cooked
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="ml-auto h-7 rounded-full px-2 text-[11px]">
                •••
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setModalOpen(true)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={openDuplicateDialog}>
                <Copy className="mr-2 h-3.5 w-3.5" />
                Duplicate...
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={handleRemove}>
                <X className="mr-2 h-3.5 w-3.5" />
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <MealFormModal
        key={`${date.toISOString()}-${slot}-${meal.id}-${modalOpen ? "open" : "closed"}`}
        open={modalOpen}
        onOpenChange={setModalOpen}
        date={date}
        mealSlot={slot}
        recipes={recipes}
        members={members}
        defaultValues={editDefaults}
      />

      <Dialog open={duplicateOpen} onOpenChange={setDuplicateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicate meal</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor={`duplicate-date-${slot}`}>Target date</Label>
              <Input
                id={`duplicate-date-${slot}`}
                type="date"
                value={duplicateDate}
                onChange={(event) => setDuplicateDate(event.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Target slot</Label>
              <Select
                value={duplicateSlot}
                onValueChange={(value) => setDuplicateSlot(value as MealSlotEnum)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LUNCH">Lunch</SelectItem>
                  <SelectItem value="DINNER">Dinner</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDuplicateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => handleDuplicate(parseISO(duplicateDate), duplicateSlot)}
              disabled={isPending || !duplicateDate}
            >
              Duplicate meal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
