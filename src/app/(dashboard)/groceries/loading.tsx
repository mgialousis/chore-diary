import { Skeleton } from "@/components/ui/skeleton";

export default function GroceriesLoading() {
  return (
    <div className="p-4 md:p-6 space-y-4">
      <Skeleton className="h-8 w-40" />
      <div className="flex gap-2">
        <Skeleton className="h-7 w-24 rounded-full" />
        <Skeleton className="h-7 w-24 rounded-full" />
        <Skeleton className="h-7 w-28 rounded-full" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-xl border overflow-hidden">
          <Skeleton className="h-11 w-full rounded-none" />
          <div className="px-4 py-2 space-y-3">
            {Array.from({ length: 3 }).map((_, j) => (
              <Skeleton key={j} className="h-8 w-full" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
