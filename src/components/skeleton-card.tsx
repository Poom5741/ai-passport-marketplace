export function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="aspect-video w-full animate-pulse bg-zinc-200 dark:bg-zinc-800" />
      <div className="flex flex-col gap-2 p-4">
        <div className="h-5 w-3/4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="h-4 w-1/3 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="flex gap-1.5 pt-1">
          <div className="h-5 w-12 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-700" />
          <div className="h-5 w-16 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-700" />
        </div>
        <div className="h-3 w-10 animate-pulse rounded bg-zinc-200 pt-2 dark:bg-zinc-700" />
      </div>
    </div>
  );
}
