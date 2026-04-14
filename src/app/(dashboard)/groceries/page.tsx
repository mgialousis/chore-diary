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
    generateGroceryList(household.id, today, in7Days),
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
    <div className="p-4 md:p-6 space-y-4">
      <h1 className="text-2xl font-bold">Grocery List</h1>
      <GroceryList
        householdId={household.id}
        manualItems={manualItems}
        boughtItems={boughtItems}
        initialAggregated={aggregated}
      />
    </div>
  );
}
