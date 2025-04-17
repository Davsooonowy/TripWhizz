import { Skeleton } from '@/components/ui/skeleton';

export function TripStageSkeleton() {
  return (
    <div className="border rounded-lg p-3 space-y-2">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-md" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>
    </div>
  );
}
