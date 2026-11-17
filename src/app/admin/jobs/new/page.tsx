"use client";

import { useState } from "react";
import { csrfHeaders } from "@/lib/client-security";
import { useRouter } from "next/navigation";
import { LoadingButton } from "@/components/loading-button";

export default function NewJobPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch("/api/admin/jobs", { method: "POST", headers: { "Content-Type": "application/json", ...(await csrfHeaders()) }, body: JSON.stringify(values) });
    if (response.ok) router.push("/admin/jobs"); else setError("Please check the form and try again.");
    setLoading(false);
  }
  return <main className="mx-auto max-w-3xl px-5 py-12 lg:px-8"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal">Content</p><h1 className="mt-3 font-newsreader text-5xl tracking-[-0.05em]">Add a job.</h1><form onSubmit={submit} className="mt-10 grid gap-4 rounded-2xl border bg-surface p-6 sm:grid-cols-2">{[["companyName","Company name"],["role","Role"],["location","Location"],["stipend","Salary / stipend"],["category","Category"],["applyUrl","Apply URL"]].map(([name,label]) => <label key={name} className="text-sm font-medium">{label}<input name={name} required className="mt-2 w-full rounded-xl border bg-transparent px-4 py-3 outline-none focus:border-teal" /></label>)}<label className="text-sm font-medium">Work mode<select name="workMode" className="mt-2 w-full rounded-xl border bg-transparent px-4 py-3"><option>Remote</option><option>Hybrid</option><option>On-site</option></select></label><label className="text-sm font-medium">Job type<select name="jobType" className="mt-2 w-full rounded-xl border bg-transparent px-4 py-3"><option>Internship</option><option>Full-time</option></select></label><label className="text-sm font-medium">Status<select name="status" className="mt-2 w-full rounded-xl border bg-transparent px-4 py-3"><option>DRAFT</option><option>PUBLISHED</option></select></label><label className="sm:col-span-2 text-sm font-medium">Description<textarea name="description" required minLength={20} rows={6} className="mt-2 w-full rounded-xl border bg-transparent px-4 py-3 outline-none focus:border-teal" /></label>{error && <p className="text-sm text-red-700 sm:col-span-2">{error}</p>}<LoadingButton type="submit" loading={loading} loadingText="Saving job..." className="rounded-xl bg-teal px-4 py-3 font-semibold text-white sm:col-span-2">Save job</LoadingButton></form></main>;
}
