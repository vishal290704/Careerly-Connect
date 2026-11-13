import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/user-auth";
import { connectToDatabase } from "@/lib/db";
import { Application } from "@/models/Application";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const premium = Boolean(user.premiumExpiresAt && user.premiumExpiresAt > new Date());
  await connectToDatabase();
  const applications = await Application.find({ userId: user._id }).populate("jobId", "companyName role location").sort({ appliedAt: -1 }).lean();
  return <main className="mx-auto max-w-7xl px-5 py-12 lg:px-8"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal">Your workspace</p><h1 className="mt-3 font-newsreader text-5xl tracking-[-0.05em]">Welcome, {user.name.split(" ")[0]}.</h1><div className="mt-4"><Link href="/referrals" className="text-sm font-semibold text-teal">View referral programme →</Link></div><div className="mt-10 grid gap-4 md:grid-cols-3"><section className="rounded-2xl border bg-surface p-6 md:col-span-2"><p className="text-sm text-muted">Applications</p>{applications.length === 0 ? <><h2 className="mt-2 text-xl font-semibold">No applications yet</h2><p className="mt-2 text-sm leading-6 text-muted">When you apply through Applyora, your recorded click-throughs will appear here.</p></> : <div className="mt-4 space-y-3">{applications.map((application) => { const appliedJob = application.jobId as { _id: string; companyName: string; role: string; location: string } | null; return <div key={application._id.toString()} className="rounded-xl border p-4"><p className="font-semibold">{appliedJob?.role ?? "Job unavailable"}</p><p className="mt-1 text-sm text-muted">{appliedJob?.companyName} · {appliedJob?.location}</p><p className="mt-2 text-xs text-teal">Application click-through recorded</p></div>; })}</div>}<Link href="/jobs" className="mt-6 inline-block rounded-xl bg-teal px-5 py-3 text-sm font-semibold text-white">Explore jobs</Link></section><section className="rounded-2xl border bg-surface p-6"><p className="text-sm text-muted">Membership</p><h2 className="mt-2 text-xl font-semibold">{premium ? "Premium active" : "Free plan"}</h2><p className="mt-2 text-sm leading-6 text-muted">{premium ? `Active until ${user.premiumExpiresAt?.toLocaleDateString()}` : "Unlock every opportunity with Premium."}</p>{!premium && <Link href="/premium" className="mt-6 inline-block text-sm font-semibold text-teal">View Premium →</Link>}</section></div></main>;
}
