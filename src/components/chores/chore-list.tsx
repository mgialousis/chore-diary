"use client";

import { useState } from "react";
import { isPast, startOfDay, isToday } from "date-fns";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChoreCard } from "@/components/chores/chore-card";
import { ChoreForm } from "@/components/chores/chore-form";
import { ChoreFilters, type FilterOwner } from "@/components/chores/chore-filters";
import { toggleChoreTemplateActive } from "@/actions/chores";
import { toast } from "sonner";
import type { ChoreInstanceWithTemplate, ChoreTemplateFormValues } from "@/types";
import type { HouseholdMember, User } from "@prisma/client";

function Section({
  title,
  chores,
  onEdit,
}: {
  title: string;
  chores: ChoreInstanceWithTemplate[];
  onEdit: (chore: ChoreInstanceWithTemplate) => void;
}) {
  if (chores.length === 0) return null;
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
      {chores.map((c) => (
        <ChoreCard key={c.id} chore={c} onEdit={onEdit} />
      ))}
    </section>
  );
}

export function ChoreList({
  dueToday,
  upcoming,
  overdue,
  recentlyCompleted,
  members,
  currentUserId,
}: {
  dueToday: ChoreInstanceWithTemplate[];
  upcoming: ChoreInstanceWithTemplate[];
  overdue: ChoreInstanceWithTemplate[];
  recentlyCompleted: ChoreInstanceWithTemplate[];
  members: (HouseholdMember & { user: User })[];
  currentUserId: string;
}) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingChore, setEditingChore] = useState<ChoreInstanceWithTemplate | null>(null);
  const [ownerFilter, setOwnerFilter] = useState<FilterOwner>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const partnerId = members.find((m) => m.user.id !== currentUserId)?.user.id;

  function filterChores(chores: ChoreInstanceWithTemplate[]) {
    return chores.filter((c) => {
      if (ownerFilter === "mine" && c.assignedUserId !== currentUserId) return false;
      if (ownerFilter === "partner" && c.assignedUserId !== partnerId) return false;
      if (ownerFilter === "overdue") {
        const d = new Date(c.dueDate);
        if (!isPast(startOfDay(d)) || isToday(d)) return false;
      }
      if (categoryFilter !== "all" && c.category !== categoryFilter) return false;
      return true;
    });
  }

  const editingTemplate = editingChore?.choreTemplate;
  const editDefaultValues: Partial<ChoreTemplateFormValues> | undefined = editingTemplate
    ? {
        name: editingTemplate.name,
        category: editingTemplate.category,
        assignedUserId: editingTemplate.assignedUserId,
        recurrenceType: editingTemplate.recurrenceType,
        recurrenceInterval: editingTemplate.recurrenceInterval,
        daysOfWeek: editingTemplate.daysOfWeek,
        startDate: editingTemplate.nextDueDate
          ? new Date(editingTemplate.nextDueDate)
          : new Date(),
        notes: editingTemplate.notes ?? "",
      }
    : undefined;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Chores</h1>
        <Button
          className="hidden md:flex gap-2"
          onClick={() => setIsCreateOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Add chore
        </Button>
      </div>

      {/* Filters */}
      <ChoreFilters
        owner={ownerFilter}
        category={categoryFilter}
        onOwnerChange={setOwnerFilter}
        onCategoryChange={setCategoryFilter}
      />

      {/* Sections */}
      <div className="space-y-8">
        <Section title="Due Today" chores={filterChores(dueToday)} onEdit={setEditingChore} />
        <Section title="Overdue" chores={filterChores(overdue)} onEdit={setEditingChore} />
        <Section title="Upcoming" chores={filterChores(upcoming)} onEdit={setEditingChore} />
        <Section title="Recently Done / Skipped" chores={filterChores(recentlyCompleted)} onEdit={setEditingChore} />

        {/* Empty state */}
        {filterChores([...dueToday, ...overdue, ...upcoming, ...recentlyCompleted]).length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No chores yet</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setIsCreateOpen(true)}
            >
              Add your first chore
            </Button>
          </div>
        )}
      </div>

      {/* Mobile FAB */}
      <Button
        className="fixed bottom-20 right-4 z-50 h-14 w-14 rounded-full shadow-lg md:hidden"
        size="icon"
        onClick={() => setIsCreateOpen(true)}
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Create dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Chore</DialogTitle>
          </DialogHeader>
          <ChoreForm
            members={members}
            onSuccess={() => setIsCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editingChore} onOpenChange={(open) => !open && setEditingChore(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Chore</DialogTitle>
          </DialogHeader>
          {editingChore?.choreTemplate && (
            <>
              <ChoreForm
                members={members}
                templateId={editingChore.choreTemplate.id}
                defaultValues={editDefaultValues}
                onSuccess={() => setEditingChore(null)}
              />
              <Button
                variant="outline"
                className="w-full"
                onClick={async () => {
                  const result = await toggleChoreTemplateActive(editingChore.choreTemplate!.id);
                  if (result?.error) {
                    toast.error(result.error);
                  } else {
                    toast.success(
                      editingChore.choreTemplate!.isActive ? "Chore deactivated" : "Chore reactivated",
                    );
                    setEditingChore(null);
                  }
                }}
              >
                {editingChore.choreTemplate.isActive ? "Deactivate chore" : "Reactivate chore"}
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
