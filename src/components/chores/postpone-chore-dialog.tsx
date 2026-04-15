"use client";

import { useState, useTransition } from "react";
import { addDays, format } from "date-fns";
import { toast } from "sonner";
import { postponeChore } from "@/actions/chores";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function PostponeChoreDialog({
  open,
  onOpenChange,
  choreId,
  choreName,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  choreId: string;
  choreName: string;
  onSuccess?: () => void;
}) {
  const tomorrow = addDays(new Date(), 1);
  const [selectedDate, setSelectedDate] = useState(format(tomorrow, "yyyy-MM-dd"));
  const [isPending, startTransition] = useTransition();

  function handleTomorrow() {
    startTransition(async () => {
      const result = await postponeChore(choreId, tomorrow);
      if (result?.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Chore postponed to tomorrow");
      onOpenChange(false);
      onSuccess?.();
    });
  }

  function handleCustomDate() {
    startTransition(async () => {
      const result = await postponeChore(choreId, new Date(selectedDate));
      if (result?.error) {
        toast.error(result.error);
        return;
      }

      toast.success(`Chore postponed to ${format(new Date(selectedDate), "MMM d")}`);
      onOpenChange(false);
      onSuccess?.();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Postpone chore</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Move <span className="font-medium text-foreground">{choreName}</span> to a future date.
          </p>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={handleTomorrow}
              disabled={isPending}
            >
              Postpone for tomorrow
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`postpone-date-${choreId}`}>Postpone for...</Label>
            <Input
              id={`postpone-date-${choreId}`}
              type="date"
              min={format(tomorrow, "yyyy-MM-dd")}
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleCustomDate} disabled={isPending || !selectedDate}>
            Postpone
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
