import { Skeleton } from "@/components/ui/skeleton";

export default function MealsLoading() {
  return (
    <div className="p-4 md:p-6 space-y-4">
      <Skeleton className="h-8 w-40" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-8 w-16" />
      </div>
      <div className="hidden md:grid grid-cols-7 gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-8" />
        ))}
        {Array.from({ length: 14 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
      <div className="md:hidden space-y-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
