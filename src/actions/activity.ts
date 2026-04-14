"use server";

import { db } from "@/lib/db";
import type { EventType } from "@prisma/client";

export async function logActivity({
  householdId,
  userId,
  eventType,
  entityType,
  entityId,
  message,
}: {
  householdId: string;
  userId: string;
  eventType: EventType;
  entityType: string;
  entityId?: string;
  message: string;
}) {
  await db.activityLog.create({
    data: {
      householdId,
      userId,
      eventType,
      entityType,
      entityId,
      message,
    },
  });
}
