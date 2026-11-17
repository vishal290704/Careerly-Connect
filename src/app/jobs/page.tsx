import { connectToDatabase } from "@/lib/db";
import { Job as JobModel } from "@/models/Job";
import { JobCard } from "@/components/job-card";
import { JobSearchForm } from "@/components/job-search-form";
import { Suspense } from "react";

type Props = { searchParams: Promise<{ q?: string; category?: string }> };

export default async function JobsPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const category = params.category;
  await connectToDatabase();
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const filter = {
    status: "PUBLISHED",
    ...(category ? { category } : {}),
    ...(escaped ? { $or: [
      { role: { $regex: escaped, $options: "i" } },
      { companyName: { $regex: escaped, $options: "i" } },
      { location: { $regex: escaped, $options: "i" } },
      { category: { $regex: escaped, $options: "i" } },
      { description: { $regex: escaped, $options: "i" } },
      { requiredSkills: { $regex: escaped, $options: "i" } },
      { workMode: { $regex: escaped, $options: "i" } },
      { jobType: { $regex: escaped, $options: "i" } },
    ] } : {}),
  };
  const records = await JobModel.find(filter).sort({ publishedAt: -1, createdAt: -1 }).lean();
  const source = records.map((job) => ({
    id: job._id.toString(), company: job.companyName, role: job.role, location: job.location,
    mode: job.workMode, type: job.jobType, pay: job.stipend, batch: "Open to eligible applicants",
    category: job.category, posted: "Recently", verified: false,
  }));
  const filtered = source;
  return (
    <main className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal">
          The opportunity desk
        </p>
        <h1 className="mt-3 font-newsreader text-5xl tracking-[-0.05em]">
          Find work that fits.
        </h1>
        <p className="mt-4 text-muted">
          A considered collection of roles for people building what comes next.
        </p>
      </div>
      <Suspense fallback={<div className="mt-9 h-16 max-w-3xl rounded-2xl border bg-surface" />}>
        <JobSearchForm defaultValue={params.q} category={category} />
      </Suspense>
      <div className="mt-12 flex items-center justify-between border-b pb-4">
        <p className="text-sm text-muted">
          {filtered.length} opportunities matching your search
        </p>
        <select className="rounded-lg border bg-surface px-3 py-2 text-sm outline-none">
          <option>Latest first</option>
          <option>Salary highest</option>
        </select>
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {filtered.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
      {filtered.length === 0 && <p className="mt-10 rounded-2xl border bg-surface p-8 text-center text-muted">No published jobs match your search.</p>}
    </main>
  );
}
