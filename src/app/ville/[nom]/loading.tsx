import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Chargement du relevé">
      <div className="space-y-3">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-9 w-full max-w-sm" />
      </div>

      <Skeleton className="h-80 rounded-xl" />
      <Skeleton className="h-44 rounded-xl" />

      <div className="grid items-start gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Skeleton className="h-96 rounded-xl" />
        <div className="space-y-6">
          <Skeleton className="h-52 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
