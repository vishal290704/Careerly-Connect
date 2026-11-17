import { Skeleton } from "@/components/skeleton";

export default function DashboardLoading() {
  return <main className="mx-auto max-w-7xl px-5 py-12 lg:px-8"><Skeleton className="h-4 w-36" /><Skeleton className="mt-3 h-12 w-72" /><div className="mt-10 grid gap-4 sm:grid-cols-2">{[0,1].map((item) => <div key={item} className="rounded-2xl border bg-surface p-6"><Skeleton className="h-4 w-28" /><Skeleton className="mt-3 h-12 w-16" /></div>)}</div><div className="mt-8 grid gap-6 lg:grid-cols-[1.45fr_0.75fr]"><div className="space-y-6">{[0,1].map((item) => <div key={item} className="rounded-2xl border bg-surface p-6"><Skeleton className="h-6 w-44" /><Skeleton className="mt-5 h-20 w-full" /></div>)}</div><div className="rounded-2xl border bg-surface p-6"><Skeleton className="h-5 w-40" /><Skeleton className="mt-5 h-28 w-full" /></div></div></main>;
}
