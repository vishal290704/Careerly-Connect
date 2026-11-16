"use client";

import { useState } from "react";
import { csrfHeaders } from "@/lib/client-security";
import { useRouter } from "next/navigation";

type Job = { _id: string; companyName: string; role: string; location: string; stipend: string; category: string; applyUrl: string; workMode: string; jobType: string; status: string; description: string };
const fields = [["companyName", "Company name"], ["role", "Role"], ["location", "Location"], ["stipend", "Salary / stipend"], ["category", "Category"], ["applyUrl", "Apply URL"]] as const;

export function EditJobForm({ job }: { job: Job }) {
  const [error, setError] = useState("");
  const router = useRouter();
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch(`/api/admin/jobs/${job._id}`, { method: "PATCH", headers: { "Content-Type": "application/json", ...(await csrfHeaders()) }, body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))) });
    if (response.ok) router.push("/admin/jobs"); else setError("Please check the form and try again.");
  }
  return <form onSubmit={submit} className="mt-10 grid gap-4 rounded-2xl border bg-surface p-6 sm:grid-cols-2">{fields.map(([name, label]) => <label key={name} className="text-sm font-medium">{label}<input name={name} defaultValue={job[name]} required className="mt-2 w-full rounded-xl border bg-transparent px-4 py-3 outline-none focus:border-teal" /></label>)}<label className="text-sm font-medium">Work mode<select name="workMode" defaultValue={job.workMode} className="mt-2 w-full rounded-xl border bg-transparent px-4 py-3"><option>Remote</option><option>Hybrid</option><option>On-site</option></select></label><label className="text-sm font-medium">Job type<select name="jobType" defaultValue={job.jobType} className="mt-2 w-full rounded-xl border bg-transparent px-4 py-3"><option>Internship</option><option>Full-time</option></select></label><label className="text-sm font-medium">Status<select name="status" defaultValue={job.status} className="mt-2 w-full rounded-xl border bg-transparent px-4 py-3"><option>DRAFT</option><option>PUBLISHED</option><option>CLOSED</option></select></label><label className="sm:col-span-2 text-sm font-medium">Description<textarea name="description" defaultValue={job.description} required minLength={20} rows={6} className="mt-2 w-full rounded-xl border bg-transparent px-4 py-3 outline-none focus:border-teal" /></label>{error && <p className="text-sm text-red-700 sm:col-span-2">{error}</p>}<button className="rounded-xl bg-teal px-4 py-3 font-semibold text-white sm:col-span-2">Save changes</button></form>;
}
