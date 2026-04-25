"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { USER_COLOR_OPTIONS } from "@/lib/user-colors";
import type { UserColor } from "@prisma/client";

const updateDisplayNameSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(50, "Name is too long"),
  colorPreference: z.enum(USER_COLOR_OPTIONS.map((option) => option.value) as [string, ...string[]]),
});

export async function updateDisplayName(input: { name: string; colorPreference: (typeof USER_COLOR_OPTIONS)[number]["value"] }) {
  const user = await requireAuth();

  const parsed = updateDisplayNameSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      name: parsed.data.name,
      colorPreference: parsed.data.colorPreference as UserColor,
    },
  });

  revalidatePath("/today");
  revalidatePath("/chores");
  revalidatePath("/meals");
  revalidatePath("/recipes");
  revalidatePath("/groceries");
  revalidatePath("/history");
}
