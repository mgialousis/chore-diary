import { addDays } from "date-fns";
import { db } from "@/lib/db";
import { toDateOnly } from "@/lib/date";
import { requireHousehold } from "@/lib/household";
import { generateGroceryList } from "@/actions/groceries";
import { GroceryList } from "@/components/groceries/grocery-list";

export default async function GroceriesPage() {
  const { household } = await requireHousehold();

  const today = toDateOnly(new Date());
  const in7Days = toDateOnly(addDays(today, 7));

  const [aggregated, manualItems, boughtItems] = await Promise.all([
    generateGroceryList(today, in7Days),
    db.groceryItem.findMany({
      where: { householdId: household.id, status: "NEEDED" },
      orderBy: { createdAt: "desc" },
    }),
    db.groceryItem.findMany({
      where: { householdId: household.id, status: "BOUGHT" },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Household Planner
        </p>
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Grocery List</h1>
            <p className="text-sm text-muted-foreground">
              Collect ingredients from planned meals and keep manual items in one place.
            </p>
          </div>
        </div>
      </div>
      <GroceryList
        manualItems={manualItems}
        boughtItems={boughtItems}
        initialAggregated={aggregated}
      />
    </div>
  );
}
