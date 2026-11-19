"use client";

import { useState } from "react";
import { csrfHeaders } from "@/lib/client-security";
import { useRouter } from "next/navigation";
import { LoadingButton } from "@/components/loading-button";
import { Upload } from "lucide-react";

export default function NewJobPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvMessage, setCsvMessage] = useState("");
  const [csvError, setCsvError] = useState("");
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

  async function uploadCsv() {
    if (!csvFile || csvLoading) return;
    setCsvLoading(true);
    setCsvError("");
    setCsvMessage("");
    try {
      const data = new FormData();
      data.set("file", csvFile);
      const response = await fetch("/api/admin/jobs/import", {
        method: "POST",
        headers: await csrfHeaders(),
        body: data,
      });
      const result = await response.json();
      if (!response.ok) {
        setCsvError(result.error ?? "Unable to upload the CSV.");
      } else {
        setCsvMessage(`${result.created} job${result.created === 1 ? "" : "s"} uploaded successfully.${result.skipped ? ` ${result.skipped} duplicate or invalid row${result.skipped === 1 ? "" : "s"} skipped.` : ""}`);
        setCsvFile(null);
        router.refresh();
      }
    } catch {
      setCsvError("Unable to upload the CSV. Please try again.");
    } finally {
      setCsvLoading(false);
    }
  }

  function downloadTemplate() {
    const csv = "companyName,role,location,stipend,workMode,jobType,category,description,applyUrl,requiredSkills,status\nNorthstar Labs,Software Engineer,Bengaluru,₹8–12 LPA,Hybrid,Full-time,Engineering,Build thoughtful software with a collaborative team.,https://example.com/apply,JavaScript|React|Node.js,PUBLISHED\n";
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "applyora-jobs-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return <main className="mx-auto max-w-5xl px-5 py-12 lg:px-8"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal">Content</p><h1 className="mt-3 font-newsreader text-5xl tracking-[-0.05em]">Add a job.</h1>
    <section className="mt-8 rounded-2xl border bg-surface p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div><p className="font-semibold">Upload jobs from CSV</p><p className="mt-2 text-sm leading-6 text-muted">Upload one or many jobs. PUBLISHED jobs appear on the user website immediately.</p></div>
        <button type="button" onClick={downloadTemplate} className="shrink-0 rounded-lg border px-3 py-2 text-sm font-semibold hover:border-teal">Download template</button>
      </div>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex min-h-12 flex-1 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm">
          <Upload size={18} className="text-teal" />
          <span className="truncate">{csvFile?.name ?? "Choose CSV file"}</span>
          <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(event) => setCsvFile(event.target.files?.[0] ?? null)} />
        </label>
        <LoadingButton type="button" disabled={!csvFile} loading={csvLoading} loadingText="Uploading CSV..." onClick={uploadCsv} className="rounded-xl bg-teal px-5 py-3 text-sm font-semibold text-white">Upload CSV file</LoadingButton>
      </div>
      {csvError && <p className="mt-4 text-sm text-red-700" role="alert">{csvError}</p>}
      {csvMessage && <p className="mt-4 text-sm font-medium text-teal" role="status">{csvMessage}</p>}
      <p className="mt-4 text-xs leading-5 text-muted">CSV columns: companyName, role, location, stipend, workMode, jobType, category, description, applyUrl, requiredSkills, status. Work mode is Remote, Hybrid, or On-site. Job type is Internship or Full-time. Separate required skills with |.</p>
    </section>
    <div className="my-8 flex items-center gap-4"><div className="h-px flex-1 bg-line" /><span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">or add manually</span><div className="h-px flex-1 bg-line" /></div>
    <form onSubmit={submit} className="grid gap-4 rounded-2xl border bg-surface p-6 sm:grid-cols-2">{[["companyName","Company name"],["role","Role"],["location","Location"],["stipend","Salary / stipend"],["category","Category"],["applyUrl","Apply URL"]].map(([name,label]) => <label key={name} className="text-sm font-medium">{label}<input name={name} required className="mt-2 w-full rounded-xl border bg-transparent px-4 py-3 outline-none focus:border-teal" /></label>)}<label className="text-sm font-medium">Work mode<select name="workMode" className="mt-2 w-full rounded-xl border bg-transparent px-4 py-3"><option>Remote</option><option>Hybrid</option><option>On-site</option></select></label><label className="text-sm font-medium">Job type<select name="jobType" className="mt-2 w-full rounded-xl border bg-transparent px-4 py-3"><option>Internship</option><option>Full-time</option></select></label><label className="text-sm font-medium">Status<select name="status" className="mt-2 w-full rounded-xl border bg-transparent px-4 py-3"><option>DRAFT</option><option>PUBLISHED</option></select></label><label className="sm:col-span-2 text-sm font-medium">Description<textarea name="description" required minLength={20} rows={6} className="mt-2 w-full rounded-xl border bg-transparent px-4 py-3 outline-none focus:border-teal" /></label>{error && <p className="text-sm text-red-700 sm:col-span-2">{error}</p>}<LoadingButton type="submit" loading={loading} loadingText="Saving job..." className="rounded-xl bg-teal px-4 py-3 font-semibold text-white sm:col-span-2">Save job</LoadingButton></form></main>;
}
