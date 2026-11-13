import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import { PaymentsTable } from "./payments-table";

export default async function AdminPaymentsPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  return <main className="mx-auto max-w-7xl px-5 py-12 lg:px-8"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal">Revenue</p><h1 className="mt-3 font-newsreader text-5xl tracking-[-0.05em]">Payment review.</h1><PaymentsTable /></main>;
}
