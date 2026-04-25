"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isPast,
  isSameDay,
  isSameMonth,
  isToday,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight, LayoutList, PauseCircle, Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChoreCard } from "@/components/chores/chore-card";
import { ChoreForm } from "@/components/chores/chore-form";
import { ChoreFilters, type FilterOwner } from "@/components/chores/chore-filters";
import { deleteChoreTemplate, toggleChoreTemplateActive } from "@/actions/chores";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getUserColorOption } from "@/lib/user-colors";
import type { ChoreInstanceWithTemplate, ChoreTemplateFormValues, InactiveChoreTemplate } from "@/types";
import type { HouseholdMember, User, UserColor } from "@prisma/client";

function Section({
  title,
  chores,
  onEdit,
  memberSummaryById,
}: {
  title: string;
  chores: ChoreInstanceWithTemplate[];
  onEdit: (chore: ChoreInstanceWithTemplate) => void;
  memberSummaryById: Map<string, { name: string; colorPreference: UserColor | null }>;
}) {
  if (chores.length === 0) return null;
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
      {chores.map((c) => (
        <ChoreCard key={c.id} chore={c} onEdit={onEdit} memberSummaryById={memberSummaryById} />
      ))}
    </section>
  );
}

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

function InactiveSection({
  chores,
}: {
  chores: InactiveChoreTemplate[];
}) {
  if (chores.length === 0) return null;

  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2">
        <PauseCircle className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Inactive chores
        </h2>
      </div>
      <div className="space-y-2">
        {chores.map((chore) => (
          <div
            key={chore.id}
            className="flex items-center gap-3 rounded-lg border border-dashed bg-muted/20 p-4"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{chore.name}</span>
                <Badge
                  variant="secondary"
                  className={cn("text-xs", categoryColors[chore.category])}
                >
                  {chore.category.replace("_", " ")}
                </Badge>
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {chore.assignedUser
                  ? `Assigned to ${chore.assignedUser.name}`
                  : "Unassigned"}
              </p>
            </div>
            <Button
              variant="outline"
              className="gap-1.5"
              onClick={async () => {
                const result = await toggleChoreTemplateActive(chore.id);
                if (result?.error) {
                  toast.error(result.error);
                } else {
                  toast.success("Chore reactivated");
                }
              }}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reactivate
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}

function CalendarView({
  month,
  chores,
  members,
  onEdit,
  onAddForDate,
}: {
  month: Date;
  chores: ChoreInstanceWithTemplate[];
  members: (HouseholdMember & { user: User })[];
  onEdit: (chore: ChoreInstanceWithTemplate) => void;
  onAddForDate: (date: Date) => void;
}) {
  const router = useRouter();
  const memberSummaryById = useMemo(
    () =>
      new Map(
        members.map((member) => [
          member.user.id,
          {
            name: member.user.name,
            colorPreference: member.user.colorPreference,
          },
        ]),
      ),
    [members],
  );
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const weekLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  function navigateMonth(delta: -1 | 1) {
    const nextMonth = delta === 1 ? addMonths(monthStart, 1) : subMonths(monthStart, 1);
    router.push(`/chores?view=calendar&month=${format(nextMonth, "yyyy-MM-dd")}`);
  }

  function getChoresForDay(day: Date) {
    return chores.filter((chore) => isSameDay(new Date(chore.dueDate), day));
  }

  return (
    <section className="space-y-4">
      <div className="rounded-3xl border bg-gradient-to-r from-sky-50 via-background to-violet-50 p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sky-900">
              <CalendarDays className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-[0.18em]">
                Chore calendar
              </span>
            </div>
            <h2 className="text-lg font-semibold tracking-tight">{format(monthStart, "MMMM yyyy")}</h2>
            <p className="text-sm text-muted-foreground">
              Use the month view to spot busy days and reschedule chores more deliberately.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-full" onClick={() => navigateMonth(-1)}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>
            <Button variant="outline" size="sm" className="rounded-full" onClick={() => navigateMonth(1)}>
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border bg-card/80 p-3 shadow-sm">
        <div className="grid grid-cols-7 gap-2">
          {weekLabels.map((label) => (
            <div
              key={label}
              className="px-2 py-1 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
            >
              {label}
            </div>
          ))}
          {days.map((day) => {
            const dayChores = getChoresForDay(day);
            const inMonth = isSameMonth(day, monthStart);
            const overdue = isPast(startOfDay(day)) && !isToday(day) && dayChores.length > 0;

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "min-h-[9rem] rounded-2xl border p-2.5 transition-colors",
                  inMonth ? "bg-background" : "bg-muted/20 text-muted-foreground",
                  isToday(day) && "border-foreground bg-foreground/[0.03]",
                  overdue && "border-red-200 bg-red-50/40",
                )}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      !inMonth && "text-muted-foreground/70",
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  <div className="flex items-center gap-1">
                    {dayChores.length > 0 && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {dayChores.length}
                      </span>
                    )}
                    <button
                      type="button"
                      className="flex h-6 w-6 items-center justify-center rounded-full border bg-background text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
                      onClick={() => onAddForDate(day)}
                      aria-label={`Add chore for ${format(day, "MMMM d")}`}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {dayChores.slice(0, 3).map((chore) => (
                    <button
                      key={chore.id}
                      className="w-full rounded-xl border border-border/70 bg-muted/30 px-2 py-1.5 text-left transition-colors hover:bg-muted"
                      onClick={() => onEdit(chore)}
                    >
                      <p className="truncate text-xs font-medium">{chore.name}</p>
                      <div className="mt-0.5 flex items-center justify-between gap-2">
                        <p className="truncate text-[10px] text-muted-foreground">
                          {chore.category.replace(/_/g, " ")}
                        </p>
                        {chore.assignedUserId ? (
                          (() => {
                            const assignee = memberSummaryById.get(chore.assignedUserId);
                            const colors = getUserColorOption(chore.assignedUserId, assignee?.colorPreference);

                            return (
                              <span className={cn("truncate rounded-full border px-1.5 py-0.5 text-[10px]", colors.subtle)}>
                                {assignee?.name.split(" ")[0] ?? "Assigned"}
                              </span>
                            );
                          })()
                        ) : (
                          <p className="truncate text-[10px] font-medium text-foreground/70">Unassigned</p>
                        )}
                      </div>
                    </button>
                  ))}
                  {dayChores.length > 3 && (
                    <p className="px-1 text-[10px] font-medium text-muted-foreground">
                      +{dayChores.length - 3} more
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function ChoreList({
  dueToday,
  upcoming,
  overdue,
  recentlyCompleted,
  inactiveTemplates,
  calendarChores,
  view,
  calendarMonth,
  members,
  currentUserId,
}: {
  dueToday: ChoreInstanceWithTemplate[];
  upcoming: ChoreInstanceWithTemplate[];
  overdue: ChoreInstanceWithTemplate[];
  recentlyCompleted: ChoreInstanceWithTemplate[];
  inactiveTemplates: InactiveChoreTemplate[];
  calendarChores: ChoreInstanceWithTemplate[];
  view: "list" | "calendar";
  calendarMonth: Date;
  members: (HouseholdMember & { user: User })[];
  currentUserId: string;
}) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingChore, setEditingChore] = useState<ChoreInstanceWithTemplate | null>(null);
  const [ownerFilter, setOwnerFilter] = useState<FilterOwner>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [createDate, setCreateDate] = useState<Date>(new Date());
  const router = useRouter();
  const memberSummaryById = useMemo(
    () =>
      new Map(
        members.map((member) => [
          member.user.id,
          {
            name: member.user.name,
            colorPreference: member.user.colorPreference,
          },
        ]),
      ),
    [members],
  );

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
  const createDefaultValues = useMemo<Partial<ChoreTemplateFormValues>>(
    () => ({
      startDate: createDate,
    }),
    [createDate],
  );
  const editDefaultValues: Partial<ChoreTemplateFormValues> | undefined = editingTemplate
    ? {
        name: editingTemplate.name,
        category: editingTemplate.category,
        assignedUserId: editingTemplate.assignedUserId,
        recurrenceType: editingTemplate.recurrenceType,
        recurrenceInterval: editingTemplate.recurrenceInterval,
        daysOfWeek: editingTemplate.daysOfWeek,
        startDate: editingChore ? new Date(editingChore.dueDate) : new Date(),
        notes: editingTemplate.notes ?? "",
      }
    : undefined;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">Chores</h1>
          <div className="flex items-center gap-2">
            <Button
              className="hidden md:flex gap-2"
              onClick={() => {
                setCreateDate(new Date());
                setIsCreateOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Add chore
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex rounded-full border bg-muted/30 p-1">
            <Button
              variant={view === "list" ? "default" : "ghost"}
              size="sm"
              className="rounded-full"
              onClick={() => router.push("/chores")}
            >
              <LayoutList className="mr-1.5 h-3.5 w-3.5" />
              List
            </Button>
            <Button
              variant={view === "calendar" ? "default" : "ghost"}
              size="sm"
              className="rounded-full"
              onClick={() => router.push(`/chores?view=calendar&month=${format(calendarMonth, "yyyy-MM-dd")}`)}
            >
              <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
              Calendar
            </Button>
          </div>
        </div>
      </div>

      {view === "list" ? (
        <>
          {/* Filters */}
          <ChoreFilters
            owner={ownerFilter}
            category={categoryFilter}
            onOwnerChange={setOwnerFilter}
            onCategoryChange={setCategoryFilter}
          />

          {/* Sections */}
          <div className="space-y-8">
            <Section
              title="Due Today"
              chores={filterChores(dueToday)}
              onEdit={setEditingChore}
              memberSummaryById={memberSummaryById}
            />
            <Section
              title="Overdue"
              chores={filterChores(overdue)}
              onEdit={setEditingChore}
              memberSummaryById={memberSummaryById}
            />
            <Section
              title="Upcoming"
              chores={filterChores(upcoming)}
              onEdit={setEditingChore}
              memberSummaryById={memberSummaryById}
            />
            <Section
              title="Recently Done / Skipped"
              chores={filterChores(recentlyCompleted)}
              onEdit={setEditingChore}
              memberSummaryById={memberSummaryById}
            />
            <InactiveSection chores={inactiveTemplates} />

            {filterChores([...dueToday, ...overdue, ...upcoming, ...recentlyCompleted]).length === 0 &&
              inactiveTemplates.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p>No chores yet. Add your first chore to get started.</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setCreateDate(new Date());
                    setIsCreateOpen(true);
                  }}
                >
                  Add your first chore
                </Button>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="space-y-8">
          <CalendarView
            month={calendarMonth}
            chores={calendarChores}
            members={members}
            onEdit={setEditingChore}
            onAddForDate={(date) => {
              setCreateDate(date);
              setIsCreateOpen(true);
            }}
          />
          <InactiveSection chores={inactiveTemplates} />
        </div>
      )}

      {/* Mobile FAB */}
      <Button
        className="fixed bottom-20 right-4 z-50 h-14 w-14 rounded-full shadow-lg md:hidden"
        size="icon"
        onClick={() => {
          setCreateDate(new Date());
          setIsCreateOpen(true);
        }}
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
            key={`create-${createDate.toISOString()}`}
            members={members}
            defaultValues={createDefaultValues}
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
                key={`edit-${editingChore.id}-${new Date(editingChore.dueDate).toISOString()}`}
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
              <Button
                variant="destructive"
                className="w-full"
                onClick={async () => {
                  const confirmed = window.confirm(
                    `Delete "${editingChore.choreTemplate!.name}" and all of its instances?`,
                  );

                  if (!confirmed) return;

                  const result = await deleteChoreTemplate(editingChore.choreTemplate!.id);
                  if (result?.error) {
                    toast.error(result.error);
                  } else {
                    toast.success("Chore deleted");
                    setEditingChore(null);
                  }
                }}
              >
                Delete chore
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
