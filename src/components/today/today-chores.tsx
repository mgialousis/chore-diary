"use client";

import { useOptimistic, useState, useTransition } from "react";
import { CheckSquare, Check, Clock3, AlertTriangle, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNow, isTomorrow } from "date-fns";
import { completeChore } from "@/actions/chores";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getUserColorOption } from "@/lib/user-colors";
import type { ChoreInstanceWithTemplate } from "@/types";
import type { UserColor } from "@prisma/client";
import { PostponeChoreDialog } from "@/components/chores/postpone-chore-dialog";

const CATEGORY_COLORS: Record<string, string> = {
  COOKING: "bg-orange-100 text-orange-800",
  CLEANING: "bg-blue-100 text-blue-800",
  LAUNDRY: "bg-purple-100 text-purple-800",
  GROCERIES: "bg-green-100 text-green-800",
  DISHES: "bg-yellow-100 text-yellow-800",
  TRASH: "bg-gray-100 text-gray-800",
  BATHROOM: "bg-cyan-100 text-cyan-800",
  TIDYING: "bg-indigo-100 text-indigo-800",
  HOUSEHOLD_ADMIN: "bg-slate-100 text-slate-800",
  OTHER: "bg-muted text-muted-foreground",
};

function getUpcomingLabel(date: Date) {
  if (isTomorrow(date)) return "Tomorrow";
  return format(date, "EEE, MMM d");
}

function ChoreRow({
  chore,
  overdue = false,
}: {
  chore: ChoreInstanceWithTemplate;
  overdue?: boolean;
}) {
  const [optimisticDone, setOptimisticDone] = useOptimistic(false);
  const [optimisticPostponed, setOptimisticPostponed] = useOptimistic(false);
  const [postponeOpen, setPostponeOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDone() {
    startTransition(async () => {
      setOptimisticDone(true);
      const result = await completeChore(chore.id) as { error?: string } | void;
      if (result && "error" in result && result.error) {
        toast.error(result.error);
      } else {
        toast.success("Chore completed");
      }
    });
  }

  if (optimisticDone || optimisticPostponed) return null;

  const name = chore.choreTemplate?.name ?? chore.name;
  const category = chore.category;

  return (
    <div
      className={cn(
        "flex items-center gap-3 py-3 first:pt-0 last:border-0 last:pb-0 border-b",
        overdue && "opacity-90",
      )}
    >
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-semibold tracking-tight">{name}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <Badge variant="secondary" className={cn("py-0 text-[11px]", CATEGORY_COLORS[category])}>
            {category.replace(/_/g, " ")}
          </Badge>
          {overdue && (
            <span className="text-xs text-destructive">
              {formatDistanceToNow(new Date(chore.dueDate), { addSuffix: true })}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button
          size="sm"
          variant="ghost"
          className="h-7 rounded-full px-2.5 text-[11px] text-emerald-700 hover:bg-emerald-50"
          onClick={handleDone}
          disabled={isPending}
        >
          <Check className="h-3.5 w-3.5 mr-1" />
          Done
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 rounded-full px-2.5 text-[11px] text-muted-foreground hover:bg-muted"
          onClick={() => setPostponeOpen(true)}
          disabled={isPending}
        >
          <Clock3 className="h-3.5 w-3.5 mr-1" />
          Postpone
        </Button>
      </div>
      <PostponeChoreDialog
        open={postponeOpen}
        onOpenChange={setPostponeOpen}
        choreId={chore.id}
        choreName={name}
        onSuccess={() => {
          setOptimisticPostponed(true);
        }}
      />
    </div>
  );
}

function UpcomingChoreRow({
  chore,
  memberSummaryById,
}: {
  chore: ChoreInstanceWithTemplate;
  memberSummaryById: Record<string, { name: string; colorPreference: UserColor | null }>;
}) {
  const name = chore.choreTemplate?.name ?? chore.name;
  const dueDate = new Date(chore.dueDate);
  const assignee = chore.assignedUserId ? memberSummaryById[chore.assignedUserId] : null;
  const assigneeColors = chore.assignedUserId
    ? getUserColorOption(chore.assignedUserId, assignee?.colorPreference)
    : null;

  return (
    <div className="rounded-2xl border bg-background/80 p-3 shadow-sm">
      <div className="space-y-1.5">
        <div className="flex items-start justify-between gap-3">
          <p className="line-clamp-2 text-sm font-semibold tracking-tight">{name}</p>
          <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-medium text-amber-900">
            {getUpcomingLabel(dueDate)}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="secondary" className={cn("py-0 text-[11px]", CATEGORY_COLORS[chore.category])}>
            {chore.category.replace(/_/g, " ")}
          </Badge>
          {assignee && assigneeColors && (
            <span className={cn("rounded-full border px-2 py-0.5 text-[11px]", assigneeColors.subtle)}>
              {assignee.name}
            </span>
          )}
          <span className="text-[11px] text-muted-foreground">
            {formatDistanceToNow(dueDate, { addSuffix: true })}
          </span>
        </div>
      </div>
    </div>
  );
}

export function TodayChores({
  dueChores,
  overdueChores,
  upcomingChores,
  memberSummaryById,
}: {
  dueChores: ChoreInstanceWithTemplate[];
  overdueChores: ChoreInstanceWithTemplate[];
  upcomingChores: ChoreInstanceWithTemplate[];
  memberSummaryById: Record<string, { name: string; colorPreference: UserColor | null }>;
}) {
  return (
    <div className="space-y-5">
      {/* Due today */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-semibold">Chores Due Today</h2>
        </div>
        {dueChores.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-background/80 p-4 text-sm text-muted-foreground">
            Nothing due today.
          </div>
        ) : (
          <div className="rounded-3xl border bg-card/90 px-4 py-3 shadow-sm">
            {dueChores.map((chore) => (
              <ChoreRow key={chore.id} chore={chore} />
            ))}
          </div>
        )}
      </section>

      {/* Overdue */}
      {overdueChores.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <h2 className="font-semibold">Overdue</h2>
          </div>
          <div className="rounded-3xl border border-destructive/20 bg-red-50/50 px-4 py-3 shadow-sm">
            {overdueChores.map((chore) => (
              <ChoreRow key={chore.id} chore={chore} overdue />
            ))}
          </div>
        </section>
      )}

      {upcomingChores.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-muted-foreground" />
            <div>
              <h2 className="font-semibold">Coming Up</h2>
              <p className="text-xs text-muted-foreground">
                A quick look at the next few pending chores.
              </p>
            </div>
          </div>
          <div className="rounded-3xl border bg-gradient-to-r from-amber-50/70 via-background to-sky-50/70 p-4 shadow-sm">
            <div className="grid gap-3 md:grid-cols-2">
              {upcomingChores.map((chore) => (
                <UpcomingChoreRow key={chore.id} chore={chore} memberSummaryById={memberSummaryById} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
