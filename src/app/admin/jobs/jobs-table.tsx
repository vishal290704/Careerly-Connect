"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { csrfHeaders } from "@/lib/client-security";
import { LoadingButton } from "@/components/loading-button";

type Job = { _id: string; companyName: string; role: string; location: string; status: string; jobType: string; workMode: string };

export function JobsTable() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [message, setMessage] = useState("");
  const [loadingId, setLoadingId] = useState("");
  function load() { fetch("/api/admin/jobs").then((response) => response.json()).then((result) => setJobs(result.jobs ?? [])); }
  useEffect(load, []);
  async function closeJob(id: string) {
    if (!window.confirm("Close this job and remove it from public listings?")) return;
    setLoadingId(id);
    const response = await fetch(`/api/admin/jobs/${id}`, { method: "DELETE", headers: await csrfHeaders() });
    if (response.ok) load(); else setMessage("Unable to close this job.");
    setLoadingId("");
  }
  return <div className="mt-10"><p className="mb-4 text-sm text-muted">{message || "Published jobs are visible to eligible users. Closing a job preserves its record."}</p><div className="overflow-x-auto rounded-2xl border bg-surface"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b text-muted"><tr><th className="p-4">Role</th><th className="p-4">Company</th><th className="p-4">Location</th><th className="p-4">Status</th><th className="p-4">Actions</th></tr></thead><tbody>{jobs.map((job) => <tr key={job._id} className="border-b last:border-0"><td className="p-4 font-medium">{job.role}<p className="text-xs text-muted">{job.jobType} · {job.workMode}</p></td><td className="p-4">{job.companyName}</td><td className="p-4">{job.location}</td><td className="p-4">{job.status}</td><td className="p-4"><span className="flex gap-2"><Link href={`/admin/jobs/edit/${job._id}`} className="rounded-lg border px-3 py-2 text-xs font-semibold">Edit</Link>{job.status !== "CLOSED" && <LoadingButton loading={loadingId === job._id} loadingText="Closing..." onClick={() => closeJob(job._id)} className="rounded-lg bg-ink px-3 py-2 text-xs font-semibold text-white">Close</LoadingButton>}</span></td></tr>)}</tbody></table>{jobs.length === 0 && <p className="p-8 text-center text-muted">No jobs created yet.</p>}</div></div>;
}
