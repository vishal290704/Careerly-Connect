"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bookmark, CheckCircle2, MapPin } from "lucide-react";
import type { Job } from "@/lib/jobs";
import { CompanyAvatar } from "./company-avatar";
import { csrfHeaders } from "@/lib/client-security";

export function JobCard({ job, locked = false }: { job: Job; locked?: boolean }) {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (locked) return;
    fetch("/api/saved-jobs", { cache: "no-store" })
      .then(async (response) => response.ok ? response.json() : null)
      .then((result) => {
        if (result) setSaved((result.jobs ?? []).some((item: { id: string }) => item.id === job.id));
      })
      .catch(() => {});
  }, [job.id, locked]);

  async function toggleSaved() {
    setLoading(true);
    const response = await fetch("/api/saved-jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await csrfHeaders()) },
      body: JSON.stringify({ jobId: job.id }),
    });
    if (response.status === 401) {
      router.push("/login");
      setLoading(false);
      return;
    }
    if (response.ok) {
      const result = await response.json();
      setSaved(Boolean(result.saved));
      window.dispatchEvent(new Event("applyora-saved-change"));
    }
    setLoading(false);
  }

  if (locked) {
    return <div className="relative overflow-hidden rounded-2xl border bg-surface p-5"><div className="select-none blur-[5px]"><div className="flex gap-4"><CompanyAvatar name={job.company} /><div><div className="h-4 w-44 rounded bg-muted/30" /><div className="mt-2 h-3 w-24 rounded bg-muted/20" /></div></div><div className="mt-7 h-3 w-36 rounded bg-muted/20" /><div className="mt-3 h-3 w-52 rounded bg-muted/20" /></div><div className="absolute inset-0 grid place-items-center bg-canvas/45"><span className="rounded-full border bg-surface px-4 py-2 text-xs font-semibold text-ink shadow-soft">Unlock with Premium</span></div></div>;
  }

  return (
    <article className="group rounded-2xl border bg-surface p-5 transition hover:-translate-y-0.5 hover:border-teal/50 hover:shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-4">
          <CompanyAvatar name={job.company} />
          <div>
            <div className="flex items-center gap-1.5"><span className="text-sm font-semibold">{job.company}</span>{job.verified && <CheckCircle2 size={14} className="text-teal" />}</div>
            <h3 className="mt-1 text-[1.05rem] font-semibold tracking-[-0.02em]">{job.role}</h3>
          </div>
        </div>
        <button type="button" disabled={loading} aria-label={saved ? `Unsave ${job.role}` : `Save ${job.role}`} aria-pressed={saved} onClick={toggleSaved} className={`transition hover:text-teal ${saved ? "text-teal" : "text-muted"}`}>
          <Bookmark size={18} fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="mt-5 flex items-center gap-1.5 text-sm text-muted"><MapPin size={15} />{job.location}</div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs"><span className="rounded-md bg-secondary px-2.5 py-1 text-muted">{job.pay}</span><span className="rounded-md bg-secondary px-2.5 py-1 text-muted">{job.mode}</span><span className="rounded-md bg-secondary px-2.5 py-1 text-muted">{job.type}</span></div>
      <div className="mt-5 flex items-center justify-between border-t pt-4 text-xs text-muted"><span>{job.posted} · {job.batch}</span><Link href={`/jobs/${job.id}`} className="font-semibold text-teal hover:underline">View details</Link></div>
    </article>
  );
}
