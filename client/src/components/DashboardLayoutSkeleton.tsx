import { Skeleton } from './ui/skeleton';

export function DashboardLayoutSkeleton() {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar skeleton - hidden on mobile */}
      <div className="hidden md:block w-[260px] border-r border-border bg-background p-4 space-y-6 shrink-0">
        {/* Logo area */}
        <div className="flex items-center gap-3 px-2">
          <Skeleton className="h-8 w-8 rounded-md shrink-0" />
          <Skeleton className="h-4 w-24" />
        </div>

        {/* Menu items */}
        <div className="space-y-2 px-2">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>

        {/* User profile area at bottom */}
        <div className="absolute bottom-4 left-4 right-4 hidden md:block">
          <div className="flex items-center gap-3 px-1">
            <Skeleton className="h-9 w-9 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-2 w-32" />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile header skeleton */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="md:hidden flex items-center gap-3 h-14 px-4 border-b border-border">
          <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-3.5 w-16 ml-2" />
        </div>

        {/* Main content skeleton */}
        <div className="flex-1 p-4 md:p-6 space-y-4 overflow-hidden">
          <Skeleton className="h-10 w-48 rounded-lg" />
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
            <Skeleton className="h-24 md:h-32 rounded-xl" />
            <Skeleton className="h-24 md:h-32 rounded-xl" />
            <Skeleton className="h-24 md:h-32 rounded-xl hidden md:block" />
          </div>
          <Skeleton className="h-48 md:h-64 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
