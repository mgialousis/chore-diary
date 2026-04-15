"use client";

import { useOptimistic, useState, useTransition } from "react";
import { formatDistanceToNow, isToday, isTomorrow, isPast, startOfDay } from "date-fns";
import { completeChore } from "@/actions/chores";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Clock3 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { ChoreInstanceWithTemplate } from "@/types";
import { PostponeChoreDialog } from "@/components/chores/postpone-chore-dialog";

const categoryColors: Record<string, string> = {
  COOKING: "bg-orange-100 text-orange-800",
  CLEANING: "bg-blue-100 text-blue-800",
  LAUNDRY: "bg-purple-100 text-purple-800",
  GROCERIES: "bg-green-100 text-green-800",
  DISHES: "bg-cyan-100 text-cyan-800",
  TRASH: "bg-gray-100 text-gray-800",
  BATHROOM: "bg-pink-100 text-pink-800",
  TIDYING: "bg-yellow-100 text-yellow-800",
  HOUSEHOLD_ADMIN: "bg-indigo-100 text-indigo-800",
  OTHER: "bg-slate-100 text-slate-800",
};

function formatDueDate(date: Date): string {
  const d = new Date(date);
  if (isToday(d)) return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  if (isPast(startOfDay(d))) {
    return formatDistanceToNow(d, { addSuffix: false }) + " overdue";
  }
  return "In " + formatDistanceToNow(d);
}

export function ChoreCard({
  chore,
  onEdit,
}: {
  chore: ChoreInstanceWithTemplate;
  onEdit: (chore: ChoreInstanceWithTemplate) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(chore.status);
  const [postponeOpen, setPostponeOpen] = useState(false);
  const [optimisticPostponed, setOptimisticPostponed] = useOptimistic(false);

  const dueDate = new Date(chore.dueDate);
  const isOverdue = isPast(startOfDay(dueDate)) && !isToday(dueDate);
  const isDone = optimisticStatus === "COMPLETED";
  const isSkipped = optimisticStatus === "SKIPPED";

  function handleComplete() {
    startTransition(async () => {
      setOptimisticStatus("COMPLETED");
      const result = await completeChore(chore.id);
      if (result?.error) toast.error(result.error);
    });
  }

  if (optimisticPostponed) return null;

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-3 rounded-lg border bg-card p-4 transition-all",
          isOverdue && optimisticStatus === "PENDING" && "border-red-300 bg-red-50/50",
          (isDone || isSkipped) && "opacity-60",
        )}
      >
        <button
          className="flex-1 text-left"
          onClick={() => onEdit(chore)}
          disabled={isPending || isDone || isSkipped}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("font-medium", (isDone || isSkipped) && "line-through text-muted-foreground")}>
              {chore.name}
            </span>
            <Badge
              variant="secondary"
              className={cn("text-xs", categoryColors[chore.category])}
            >
              {chore.category.replace("_", " ")}
            </Badge>
            {isDone && <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">Done</Badge>}
            {isSkipped && <Badge variant="secondary" className="text-xs">Skipped</Badge>}
          </div>
          <p className={cn(
            "mt-0.5 text-sm",
            isOverdue && optimisticStatus === "PENDING" ? "text-red-600 font-medium" : "text-muted-foreground",
          )}>
            {isDone && chore.completedBy
              ? `Completed by ${chore.completedBy.name}${chore.completedAt ? ` • ${formatDistanceToNow(new Date(chore.completedAt), { addSuffix: true })}` : ""}`
              : isSkipped
                ? "Skipped"
              : formatDueDate(dueDate)}
          </p>
        </button>

        {optimisticStatus === "PENDING" && (
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5 text-muted-foreground hover:text-foreground"
              onClick={() => setPostponeOpen(true)}
              disabled={isPending}
            >
              <Clock3 className="h-3.5 w-3.5" />
              Postpone
            </Button>
            <Button
              size="sm"
              className="gap-1.5"
              onClick={handleComplete}
              disabled={isPending}
            >
              <Check className="h-3.5 w-3.5" />
              Done
            </Button>
          </div>
        )}
      </div>

      <PostponeChoreDialog
        open={postponeOpen}
        onOpenChange={setPostponeOpen}
        choreId={chore.id}
        choreName={chore.name}
        onSuccess={() => {
          setOptimisticPostponed(true);
        }}
      />
    </>
  );
}
