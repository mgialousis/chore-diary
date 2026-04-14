import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PersonStat = {
  name: string;
  count: number;
};

export function StatsCards({
  choreStats,
  mealStats,
  groceryBoughtCount,
}: {
  choreStats: PersonStat[];
  mealStats: PersonStat[];
  groceryBoughtCount: number;
}) {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Chores Done</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {choreStats.map((stat) => (
            <div key={stat.name} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{stat.name}</span>
              <span className="font-medium">{stat.count}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Meals Cooked</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {mealStats.map((stat) => (
            <div key={stat.name} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{stat.name}</span>
              <span className="font-medium">{stat.count}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Grocery Items Bought</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold">{groceryBoughtCount}</p>
          <p className="mt-1 text-sm text-muted-foreground">This week</p>
        </CardContent>
      </Card>
    </section>
  );
}
