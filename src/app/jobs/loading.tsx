import { JobCardSkeleton } from "@/components/skeleton";

export default function JobsLoading() {
  return <main className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16"><div className="h-5 w-36 rounded bg-secondary" /><div className="mt-3 h-12 w-80 max-w-full rounded bg-secondary" /><div className="mt-9 h-16 max-w-3xl rounded-2xl border bg-surface" /><div className="mt-12 grid gap-4 lg:grid-cols-2">{[0,1,2,3].map((item) => <JobCardSkeleton key={item} />)}</div></main>;
}
