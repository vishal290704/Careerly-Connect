import { notFound, redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/db";
import { Job } from "@/models/Job";
import { EditJobForm } from "./edit-job-form";

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) redirect("/admin/login");
  const { id } = await params;
  await connectToDatabase();
  const job = await Job.findById(id).lean();
  if (!job) notFound();
  return <main className="mx-auto max-w-3xl px-5 py-12 lg:px-8"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal">Content</p><h1 className="mt-3 font-newsreader text-5xl tracking-[-0.05em]">Edit job.</h1><EditJobForm job={{ ...job, _id: job._id.toString() }} /></main>;
}
