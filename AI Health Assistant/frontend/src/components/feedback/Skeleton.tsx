import { classNames } from '@/utils'

/** Shimmering placeholder block. Size it with className (e.g. "h-4 w-32"). */
export const Skeleton = ({ className }: { className?: string }) => (
  <div
    aria-hidden
    className={classNames(
      'animate-shimmer rounded-app bg-[length:200%_100%] bg-[linear-gradient(90deg,rgb(var(--c-surface))_0%,rgb(var(--c-border)/0.7)_50%,rgb(var(--c-surface))_100%)]',
      className,
    )}
  />
)

/** Placeholder for a list card (title, subtitle, badges). */
export const SkeletonCard = () => (
  <div className="card space-y-3 p-4" aria-hidden>
    <Skeleton className="h-3 w-24" />
    <Skeleton className="h-4 w-3/4" />
    <div className="flex gap-2 pt-1">
      <Skeleton className="h-7 w-20 rounded-full" />
      <Skeleton className="h-7 w-28 rounded-full" />
    </div>
  </div>
)

/** Full-page placeholder used while a route chunk loads. */
export const PageSkeleton = () => (
  <div className="mx-auto min-h-screen w-full max-w-[430px] space-y-5 bg-background px-4 py-5" role="status" aria-label="Loading">
    <div className="flex items-center gap-3">
      <Skeleton className="h-10 w-10 rounded-full" />
      <Skeleton className="h-6 w-44" />
    </div>
    <Skeleton className="h-28 w-full rounded-card" />
    <SkeletonCard />
    <SkeletonCard />
  </div>
)

export default Skeleton
