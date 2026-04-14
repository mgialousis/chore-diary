"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { choreTemplateSchema, choreCategories, recurrenceTypes, type ChoreTemplateFormValues } from "@/types";
import { createChoreTemplate, updateChoreTemplate } from "@/actions/chores";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { HouseholdMember, User } from "@prisma/client";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

const RECURRENCE_LABELS: Record<string, string> = {
  NONE: "One-time",
  DAILY: "Daily",
  EVERY_N_DAYS: "Every N days",
  WEEKLY: "Weekly",
  SPECIFIC_DAYS: "Specific days",
};

export function ChoreForm({
  members,
  defaultValues,
  templateId,
  onSuccess,
}: {
  members: (HouseholdMember & { user: User })[];
  defaultValues?: Partial<ChoreTemplateFormValues>;
  templateId?: string;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const isEditing = !!templateId;

  const form = useForm<ChoreTemplateFormValues>({
    resolver: zodResolver(choreTemplateSchema),
    defaultValues: {
      name: "",
      category: "OTHER",
      assignedUserId: null,
      recurrenceType: "NONE",
      recurrenceInterval: null,
      daysOfWeek: [],
      startDate: new Date(),
      notes: "",
      ...defaultValues,
    },
  });

  const recurrenceType = useWatch({
    control: form.control,
    name: "recurrenceType",
  });
  const daysOfWeek = useWatch({
    control: form.control,
    name: "daysOfWeek",
  });
  const category = useWatch({
    control: form.control,
    name: "category",
  });
  const assignedUserId = useWatch({
    control: form.control,
    name: "assignedUserId",
  });
  const startDate = useWatch({
    control: form.control,
    name: "startDate",
  });

  async function onSubmit(data: ChoreTemplateFormValues) {
    try {
      if (isEditing) {
        await updateChoreTemplate(templateId, data);
        toast.success("Chore saved");
      } else {
        await createChoreTemplate(data);
        toast.success("Chore saved");
      }
      router.refresh();
      onSuccess?.();
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }

  function toggleDay(day: number) {
    const current = daysOfWeek ?? [];
    const next = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day];
    form.setValue("daysOfWeek", next);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="name">Name</Label>
        <Input id="name" placeholder="e.g. Clean kitchen" {...form.register("name")} />
        {form.formState.errors.name && (
          <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
        )}
      </div>

      {/* Category */}
      <div className="space-y-1.5">
        <Label>Category</Label>
        <Select
          value={category}
          onValueChange={(v) => form.setValue("category", v as typeof choreCategories[number])}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {choreCategories.map((c) => (
              <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Assigned to */}
      <div className="space-y-1.5">
        <Label>Assigned to</Label>
        <Select
          value={assignedUserId ?? "unassigned"}
          onValueChange={(v) => form.setValue("assignedUserId", v === "unassigned" ? null : v)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {members.map((m) => (
              <SelectItem key={m.user.id} value={m.user.id}>{m.user.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Recurrence */}
      <div className="space-y-1.5">
        <Label>Recurrence</Label>
        <Select
          value={recurrenceType}
          onValueChange={(v) => form.setValue("recurrenceType", v as typeof recurrenceTypes[number])}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {recurrenceTypes.map((r) => (
              <SelectItem key={r} value={r}>{RECURRENCE_LABELS[r]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Interval (only for EVERY_N_DAYS) */}
      {recurrenceType === "EVERY_N_DAYS" && (
        <div className="space-y-1.5">
          <Label htmlFor="interval">Every how many days?</Label>
          <Input
            id="interval"
            type="number"
            min={1}
            max={365}
            {...form.register("recurrenceInterval", { valueAsNumber: true })}
          />
        </div>
      )}

      {/* Days of week (only for SPECIFIC_DAYS) */}
      {recurrenceType === "SPECIFIC_DAYS" && (
        <div className="space-y-1.5">
          <Label>Days of week</Label>
          <div className="flex gap-2 flex-wrap">
            {DAY_LABELS.map((label, i) => (
              <label key={i} className="flex items-center gap-1.5 cursor-pointer">
                <Checkbox
                  checked={daysOfWeek?.includes(i)}
                  onCheckedChange={() => toggleDay(i)}
                />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Start date */}
      <div className="space-y-1.5">
        <Label htmlFor="startDate">Start date</Label>
        <Input
          id="startDate"
          type="date"
          value={startDate instanceof Date
            ? startDate.toISOString().split("T")[0]
            : ""}
          onChange={(e) => form.setValue("startDate", new Date(e.target.value))}
        />
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          placeholder="Any extra details..."
          rows={2}
          {...form.register("notes")}
        />
      </div>

      <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting
          ? isEditing ? "Saving..." : "Creating..."
          : isEditing ? "Save changes" : "Create chore"}
      </Button>
    </form>
  );
}
