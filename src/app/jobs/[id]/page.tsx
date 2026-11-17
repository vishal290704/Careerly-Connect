import Link from "next/link";
import { ArrowLeft, CheckCircle2, MapPin } from "lucide-react";
import { notFound } from "next/navigation";
import { CompanyAvatar } from "@/components/company-avatar";
import { JobActions } from "@/components/job-actions";
import { jobs as sampleJobs } from "@/lib/jobs";
import { connectToDatabase } from "@/lib/db";
import { Job } from "@/models/Job";

export default async function JobDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let job: { id: string; company: string; role: string; location: string; mode: "Remote" | "Hybrid" | "On-site"; type: "Internship" | "Full-time"; pay: string; batch: string; verified?: boolean; description?: string; applyUrl?: string } | undefined;
  const sample = sampleJobs.find((item) => item.id === id);
  if (sample) job = sample;
  else {
    try {
      await connectToDatabase();
      const record = await Job.findOne({ _id: id, status: "PUBLISHED" }).lean();
      if (record) job = { id: record._id.toString(), company: record.companyName, role: record.role, location: record.location, mode: record.workMode, type: record.jobType, pay: record.stipend, batch: "Open to eligible applicants", description: record.description, applyUrl: record.applyUrl };
    } catch { notFound(); }
  }
  if (!job) notFound();
  const isDatabaseJob = Boolean(!sample);
  return <main className="mx-auto max-w-5xl px-5 py-12 lg:px-8 lg:py-16"><Link href="/jobs" className="inline-flex items-center gap-2 text-sm text-muted hover:text-teal"><ArrowLeft size={16} />Back to jobs</Link><section className="mt-10 rounded-3xl border bg-surface p-6 sm:p-10"><div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between"><div className="flex gap-4"><CompanyAvatar name={job.company} /><div><p className="flex items-center gap-1.5 text-sm font-semibold">{job.company}{job.verified && <CheckCircle2 size={14} className="text-teal" />}</p><h1 className="mt-2 font-newsreader text-4xl tracking-[-0.04em]">{job.role}</h1><p className="mt-3 flex items-center gap-2 text-sm text-muted"><MapPin size={15} />{job.location}</p></div></div>{isDatabaseJob && job.applyUrl ? <JobActions jobId={job.id} applyUrl={job.applyUrl} jobTitle={job.role} companyName={job.company} /> : <span className="rounded-xl border px-6 py-3 text-sm text-muted">Demo listing</span>}</div><div className="mt-10 grid gap-8 border-t pt-8 md:grid-cols-[1fr_260px]"><div><h2 className="font-semibold">About the role</h2><p className="mt-3 leading-7 text-muted">{job.description ?? "Work with a thoughtful team solving meaningful problems for people building their careers and businesses. This role is designed for curious, practical makers who care about the details."}</p><h2 className="mt-9 font-semibold">What you&apos;ll bring</h2><ul className="mt-3 list-disc space-y-2 pl-5 leading-7 text-muted"><li>Strong communication and an appetite for learning.</li><li>Comfort collaborating across disciplines.</li><li>A portfolio or project that shows your way of thinking.</li></ul></div><aside className="h-fit rounded-2xl bg-secondary p-5"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Role details</p><dl className="mt-5 space-y-4 text-sm"><div><dt className="text-muted">Compensation</dt><dd className="mt-1 font-medium">{job.pay}</dd></div><div><dt className="text-muted">Work mode</dt><dd className="mt-1 font-medium">{job.mode}</dd></div><div><dt className="text-muted">Job type</dt><dd className="mt-1 font-medium">{job.type}</dd></div><div><dt className="text-muted">Eligible batch</dt><dd className="mt-1 font-medium">{job.batch}</dd></div></dl></aside></div></section></main>;
}
