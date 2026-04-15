"use client";

import { useOptimistic, useState, useTransition } from "react";
import { CheckSquare, Check, Clock3, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { completeChore } from "@/actions/chores";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ChoreInstanceWithTemplate } from "@/types";
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
        "flex items-center gap-3 py-2.5 border-b last:border-0",
        overdue && "opacity-90",
      )}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{name}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <Badge variant="secondary" className={cn("text-xs py-0", CATEGORY_COLORS[category])}>
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
          className="h-7 px-2 text-xs text-green-700 hover:bg-green-50"
          onClick={handleDone}
          disabled={isPending}
        >
          <Check className="h-3.5 w-3.5 mr-1" />
          Done
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-xs text-muted-foreground hover:bg-muted"
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

export function TodayChores({
  dueChores,
  overdueChores,
}: {
  dueChores: ChoreInstanceWithTemplate[];
  overdueChores: ChoreInstanceWithTemplate[];
}) {
  return (
    <div className="space-y-4">
      {/* Due today */}
      <section className="space-y-2">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-semibold">Chores Due Today</h2>
        </div>
        {dueChores.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">Nothing due today!</p>
        ) : (
          <div className="rounded-xl border px-3">
            {dueChores.map((chore) => (
              <ChoreRow key={chore.id} chore={chore} />
            ))}
          </div>
        )}
      </section>

      {/* Overdue */}
      {overdueChores.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <h2 className="font-semibold">Overdue</h2>
          </div>
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-3">
            {overdueChores.map((chore) => (
              <ChoreRow key={chore.id} chore={chore} overdue />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
