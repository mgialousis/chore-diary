"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { choreCategories } from "@/types";
import { cn } from "@/lib/utils";

export type FilterOwner = "all" | "mine" | "partner" | "overdue";

const CATEGORY_LABELS: Record<string, string> = {
  COOKING: "Cooking",
  CLEANING: "Cleaning",
  LAUNDRY: "Laundry",
  GROCERIES: "Groceries",
  DISHES: "Dishes",
  TRASH: "Trash",
  BATHROOM: "Bathroom",
  TIDYING: "Tidying",
  HOUSEHOLD_ADMIN: "Admin",
  OTHER: "Other",
};

export function ChoreFilters({
  owner,
  category,
  onOwnerChange,
  onCategoryChange,
}: {
  owner: FilterOwner;
  category: string;
  onOwnerChange: (v: FilterOwner) => void;
  onCategoryChange: (v: string) => void;
}) {
  const ownerFilters: { value: FilterOwner; label: string }[] = [
    { value: "all", label: "All" },
    { value: "mine", label: "Mine" },
    { value: "partner", label: "Partner's" },
    { value: "overdue", label: "Overdue" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex rounded-md border overflow-hidden">
        {ownerFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => onOwnerChange(f.value)}
            className={cn(
              "px-3 py-1.5 text-sm transition-colors",
              owner === f.value
                ? "bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:bg-muted",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Select value={category} onValueChange={onCategoryChange}>
        <SelectTrigger className="w-36 h-8">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {choreCategories.map((c) => (
            <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
