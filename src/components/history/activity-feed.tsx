"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { CheckSquare, Clock3, ShoppingCart, UtensilsCrossed } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ActivityLogWithUser } from "@/types";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "chores", label: "Chores" },
  { value: "meals", label: "Meals" },
  { value: "groceries", label: "Groceries" },
] as const;

function getIcon(entityType: string) {
  switch (entityType) {
    case "chore":
      return CheckSquare;
    case "meal":
      return UtensilsCrossed;
    case "grocery":
      return ShoppingCart;
    default:
      return Clock3;
  }
}

function getFilterHref(filter: string) {
  return filter === "all" ? "/history" : `/history?type=${filter}`;
}

function getOffsetHref(filter: string, offset: number) {
  if (filter === "all") {
    return offset === 0 ? "/history" : `/history?offset=${offset}`;
  }

  return offset === 0
    ? `/history?type=${filter}`
    : `/history?type=${filter}&offset=${offset}`;
}

export function ActivityFeed({
  activities,
  filter,
  offset,
  pageSize,
  nextOffset,
}: {
  activities: ActivityLogWithUser[];
  filter: string;
  offset: number;
  pageSize: number;
  nextOffset: number | null;
}) {
  const previousOffset = Math.max(0, offset - pageSize);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <Link key={item.value} href={getFilterHref(item.value)}>
            <Badge variant={filter === item.value ? "default" : "outline"} className="cursor-pointer">
              {item.label}
            </Badge>
          </Link>
        ))}
      </div>

      {activities.length === 0 ? (
        <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
          No activity yet. Start using the app to see your history.
        </div>
      ) : (
        <div className="rounded-xl border divide-y">
          {activities.map((activity) => {
            const Icon = getIcon(activity.entityType);

            return (
              <div key={activity.id} className="flex gap-3 p-4">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm leading-relaxed">{activity.message}</p>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{activity.user.name}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(offset > 0 || nextOffset !== null) && (
        <div className="flex flex-wrap gap-2">
          {offset > 0 && (
            <Button variant="outline" asChild>
              <Link href={getOffsetHref(filter, previousOffset)}>
                Previous
              </Link>
            </Button>
          )}
          {nextOffset !== null && (
            <Button variant="outline" asChild>
              <Link href={getOffsetHref(filter, nextOffset)}>
                Load more
              </Link>
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
