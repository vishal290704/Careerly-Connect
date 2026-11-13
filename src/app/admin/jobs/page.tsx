import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import { JobsTable } from "./jobs-table";

export default async function AdminJobsPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  return <main className="mx-auto max-w-7xl px-5 py-12 lg:px-8"><div className="flex items-end justify-between"><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal">Content</p><h1 className="mt-3 font-newsreader text-5xl tracking-[-0.05em]">Job management.</h1></div><Link href="/admin/jobs/new" className="rounded-xl bg-teal px-5 py-3 text-sm font-semibold text-white">Add job</Link></div><JobsTable /></main>;
}
