import { z } from "zod";
import type {
  ChoreInstance,
  ChoreTemplate,
  User,
} from "@prisma/client";

// ─── Chore Schemas ─────────────────────────────────────────

export const choreCategories = [
  "COOKING",
  "CLEANING",
  "LAUNDRY",
  "GROCERIES",
  "DISHES",
  "TRASH",
  "BATHROOM",
  "TIDYING",
  "HOUSEHOLD_ADMIN",
  "OTHER",
] as const;

export const recurrenceTypes = [
  "NONE",
  "DAILY",
  "EVERY_N_DAYS",
  "WEEKLY",
  "SPECIFIC_DAYS",
] as const;

export const choreTemplateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  category: z.enum(choreCategories),
  assignedUserId: z.string().nullable(),
  recurrenceType: z.enum(recurrenceTypes),
  recurrenceInterval: z.number().min(1).max(365).nullable(),
  daysOfWeek: z.array(z.number().min(0).max(6)),
  startDate: z.date(),
  notes: z.string().max(500).optional(),
});

export type ChoreTemplateFormValues = z.infer<typeof choreTemplateSchema>;

// ─── Composite Types ────────────────────────────────────────

export type ChoreInstanceWithTemplate = ChoreInstance & {
  choreTemplate: ChoreTemplate | null;
  completedBy: User | null;
};
