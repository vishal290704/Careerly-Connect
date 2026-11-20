"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { LoadingButton } from "@/components/loading-button";

export function JobSearchForm({ defaultValue = "", category }: { defaultValue?: string; category?: string }) {
  const [query, setQuery] = useState(defaultValue);
  const [loadingTarget, setLoadingTarget] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loading = loadingTarget !== null && searchParams.toString() !== loadingTarget;

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function updateSearch(value: string) {
    setQuery(value);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const params = new URLSearchParams();
      if (value.trim()) params.set("q", value.trim());
      if (category) params.set("category", category);
      setLoadingTarget(params.toString());
      router.replace(`/jobs${params.size ? `?${params.toString()}` : ""}`);
    }, 350);
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (timer.current) clearTimeout(timer.current);
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (category) params.set("category", category);
    setLoadingTarget(params.toString());
    router.replace(`/jobs${params.size ? `?${params.toString()}` : ""}`);
  }

  return <form onSubmit={submit} className="mt-9 flex max-w-3xl items-center gap-3 rounded-2xl border bg-surface p-2 shadow-soft"><Search className="ml-3 text-muted" size={19} /><input name="q" value={query} onChange={(event) => updateSearch(event.target.value)} placeholder="Search role, company, skill or location" className="min-w-0 flex-1 bg-transparent px-2 py-3 text-sm outline-none placeholder:text-muted" /><LoadingButton type="submit" loading={loading} loadingText="Searching..." className="min-w-[96px] rounded-xl bg-teal px-5 py-3 text-sm font-semibold text-white"><span className="sr-only sm:not-sr-only">Search</span></LoadingButton></form>;
}
