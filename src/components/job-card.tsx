"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, CheckCircle2, LockKeyhole, MapPin } from "lucide-react";
import type { Job } from "@/lib/jobs";
import { CompanyAvatar } from "./company-avatar";
import { csrfHeaders } from "@/lib/client-security";
import { LoadingSpinner } from "@/components/loading-button";

export function JobCard({ job, locked = false }: { job: Job; locked?: boolean }) {
  void locked;
  const [premium, setPremium] = useState<boolean | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/subscription/status", { cache: "no-store" })
      .then(async (response) => response.ok ? response.json() : null)
      .then((result) => setPremium(result?.active ? true : false))
      .catch(() => setPremium(false));
    fetch("/api/saved-jobs", { cache: "no-store" })
      .then(async (response) => response.ok ? response.json() : null)
      .then((result) => setSaved((result?.jobs ?? []).some((item: { id: string }) => item.id === job.id)))
      .catch(() => {});
  }, [job.id]);

  async function openJob() {
    if (premium === null) return;
    if (premium) {
      router.push(`/jobs/${job.id}`);
      return;
    }
    const statusResponse = await fetch("/api/subscription/status", { cache: "no-store" });
    if (statusResponse.status === 401) {
      router.push(`/login?next=/jobs/${encodeURIComponent(job.id)}`);
      return;
    }
    router.push(`/premium?redirect=/jobs/${encodeURIComponent(job.id)}&reason=premium-required`);
  }

  async function toggleSaved(event: React.MouseEvent) {
    event.stopPropagation();
    setLoading(true);
    const response = await fetch("/api/saved-jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await csrfHeaders()) },
      body: JSON.stringify({ jobId: job.id }),
    });
    if (response.status === 401) {
      router.push(`/login?next=/jobs/${encodeURIComponent(job.id)}`);
    } else if (response.ok) {
      const result = await response.json();
      setSaved(Boolean(result.saved));
    } else if (response.status === 403) {
      await openJob();
    }
    setLoading(false);
  }

  return (
    <article
      role="link"
      tabIndex={0}
      aria-label={`View ${job.role} at ${job.company}`}
      onClick={() => void openJob()}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          void openJob();
        }
      }}
      className="group cursor-pointer rounded-2xl border bg-surface p-5 transition hover:-translate-y-0.5 hover:border-teal/50 hover:shadow-soft"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-4">
          <CompanyAvatar name={job.company} />
          <div>
            <div className="flex items-center gap-1.5"><span className="text-sm font-semibold">{job.company}</span>{job.verified && <CheckCircle2 size={14} className="text-teal" />}</div>
            <h3 className="mt-1 text-[1.05rem] font-semibold tracking-[-0.02em]">{job.role}</h3>
          </div>
        </div>
        <button type="button" disabled={loading} aria-label={saved ? `Unsave ${job.role}` : `Save ${job.role}`} aria-pressed={saved} onClick={toggleSaved} className={`transition hover:text-teal ${saved ? "text-teal" : "text-muted"}`}>
          {loading ? <LoadingSpinner size={18} /> : <Bookmark size={18} fill={saved ? "currentColor" : "none"} />}
        </button>
      </div>
      <div className="mt-5 flex items-center gap-1.5 text-sm text-muted"><MapPin size={15} />{job.location}</div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs"><span className="rounded-md bg-secondary px-2.5 py-1 text-muted">{job.pay}</span><span className="rounded-md bg-secondary px-2.5 py-1 text-muted">{job.mode}</span><span className="rounded-md bg-secondary px-2.5 py-1 text-muted">{job.type}</span></div>
      <div className="mt-5 flex items-center justify-between border-t pt-4 text-xs text-muted">
        <span>{job.posted} · {job.batch}</span>
        <span className="inline-flex items-center gap-1.5 font-semibold text-teal"><LockKeyhole size={13} /> Premium access</span>
      </div>
    </article>
  );
}
