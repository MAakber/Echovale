import { Skeleton } from "./skeleton"

export function MemoryCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden border border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm">
      <Skeleton className="aspect-[4/3] w-full" />
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-5/6 mb-4" />
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>
    </div>
  )
}

export function GallerySkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {Array.from({ length: 6 }).map((_, i) => (
        <MemoryCardSkeleton key={i} />
      ))}
    </div>
  )
}
