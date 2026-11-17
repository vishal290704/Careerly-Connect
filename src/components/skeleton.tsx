export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`skeleton-shimmer rounded-md bg-secondary ${className}`} />;
}

export function JobCardSkeleton() {
  return <div className="rounded-2xl border bg-surface p-5"><div className="flex gap-4"><Skeleton className="h-11 w-11 rounded-full" /><div className="flex-1"><Skeleton className="h-4 w-32" /><Skeleton className="mt-2 h-5 w-48" /></div></div><Skeleton className="mt-6 h-4 w-28" /><div className="mt-4 flex gap-2"><Skeleton className="h-7 w-20" /><Skeleton className="h-7 w-20" /></div><Skeleton className="mt-5 h-px w-full" /><Skeleton className="mt-4 h-4 w-36" /></div>;
}
