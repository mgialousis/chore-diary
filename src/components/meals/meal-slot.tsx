"use client";

import { useState, useTransition } from "react";
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

  function handleCooked() {
    if (!meal) return;

    startTransition(async () => {
      const result = await markMealCooked(meal.id) as { error?: string } | undefined;
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Marked as cooked!");
      }
    });
  }

  function handleRemove() {
    if (!meal) return;

    startTransition(async () => {
      const result = await removeMeal(meal.id) as { error?: string } | undefined;
      if (result?.error) {
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

  if (!meal) {
    return (
      <>
        <button
          onClick={() => setModalOpen(true)}
          className="flex h-full min-h-[5rem] w-full items-center justify-center rounded-lg border border-dashed text-muted-foreground transition-colors hover:bg-muted/50"
        >
          <Plus className="h-5 w-5" />
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
  const isCooked = meal.status === "COOKED";

  return (
    <>
      <div
        className={cn(
          "relative flex flex-col gap-1 rounded-lg border p-2.5 transition-all",
          isCooked && "border-green-200 bg-green-50/60",
          isPending && "opacity-60",
        )}
      >
        {isCooked && (
          <div className="absolute right-1.5 top-1.5">
            <Check className="h-3.5 w-3.5 text-green-600" />
          </div>
        )}

        <p className="line-clamp-2 pr-4 text-sm font-medium leading-tight">{mealName}</p>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">{meal.servings} srv</span>
          {meal.assignedTo && (
            <div className="flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-xs">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                {getInitials(meal.assignedTo.name)}
              </div>
              <span>{meal.assignedTo.name.split(" ")[0]}</span>
            </div>
          )}
          {!isCooked && <Badge variant="secondary" className="py-0 text-xs">Planned</Badge>}
          {isCooked && (
            <Badge variant="secondary" className="bg-green-100 py-0 text-xs text-green-800">
              Cooked
            </Badge>
          )}
        </div>

        <div className="mt-0.5 flex items-center gap-1">
          {!isCooked && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-xs text-green-700 hover:bg-green-100"
              onClick={handleCooked}
              disabled={isPending}
            >
              <Check className="mr-1 h-3 w-3" />
              Cooked
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="ml-auto h-6 px-1.5 text-xs">
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
