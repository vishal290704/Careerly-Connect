import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";

export default async function AdminUsersPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  return <main className="mx-auto max-w-7xl px-5 py-12 lg:px-8"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal">Community</p><h1 className="mt-3 font-newsreader text-5xl tracking-[-0.05em]">Registered users.</h1><div className="mt-10 rounded-2xl border bg-surface p-6"><p className="text-muted">User management is connected to the ApplyOra database and ready for the account table.</p></div></main>;
}
