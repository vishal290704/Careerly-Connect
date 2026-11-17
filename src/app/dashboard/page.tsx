import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/user-auth";
import { connectToDatabase } from "@/lib/db";
import { Application } from "@/models/Application";
import { SavedJob } from "@/models/SavedJob";
import { Payment } from "@/models/Payment";
import { ProfileEditor } from "@/components/profile-editor";
import mongoose from "mongoose";
import "@/models/Job";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await connectToDatabase();
  if ((user.savedJobIds ?? []).length) {
    await SavedJob.bulkWrite((user.savedJobIds ?? []).map((jobId: mongoose.Types.ObjectId) => ({
      updateOne: { filter: { userId: user._id, jobId }, update: { $setOnInsert: { userId: user._id, jobId, savedAt: new Date() } }, upsert: true },
    })));
  }

  const now = new Date();
  const premium = Boolean(user.premiumExpiresAt && user.premiumExpiresAt > now);
  const [applications, savedJobs, lastPayment] = await Promise.all([
    Application.find({ userId: user._id }).populate("jobId", "companyName role location").sort({ updatedAt: -1 }).lean(),
    SavedJob.find({ userId: user._id }).populate("jobId", "companyName role location").sort({ savedAt: -1 }).lean(),
    Payment.findOne({ userId: user._id }).sort({ createdAt: -1 }).lean(),
  ]);

  const activeApplications = applications.filter((application) => application.status === "APPLIED" || application.status === "RECORDED");
  const visibleApplications = applications.slice(0, 5);
  const visibleSavedJobs = savedJobs.slice(0, 5);
  const remainingDays = premium && user.premiumExpiresAt
    ? Math.max(0, Math.ceil((user.premiumExpiresAt.getTime() - now.getTime()) / 86400000))
    : 0;

  return (
    <main className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal">Your workspace</p>
      <h1 className="mt-3 font-newsreader text-5xl tracking-[-0.05em]">Welcome, {user.name.split(" ")[0]}.</h1>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <section className="rounded-2xl border bg-surface p-6">
          <p className="text-sm text-muted">Total Applications</p>
          <p className="mt-2 font-newsreader text-5xl">{activeApplications.length}</p>
          <p className="mt-2 text-xs text-muted">Unique jobs currently marked applied</p>
        </section>
        <section className="rounded-2xl border bg-surface p-6">
          <p className="text-sm text-muted">Saved Jobs</p>
          <p className="mt-2 font-newsreader text-5xl">{visibleSavedJobs.length > 0 || savedJobs.length > 0 ? savedJobs.length : 0}</p>
          <p className="mt-2 text-xs text-muted">Jobs saved to your account</p>
        </section>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.45fr_0.75fr]">
        <div className="space-y-6">
          <section id="applications" className="rounded-2xl border bg-surface p-6">
            <div className="flex items-center justify-between"><h2 className="text-xl font-semibold">Recent Applications</h2><Link href="/dashboard#applications" className="text-sm font-semibold text-teal">View All</Link></div>
            {visibleApplications.length === 0 ? <p className="mt-5 rounded-xl bg-secondary p-5 text-sm text-muted">No applications yet.</p> : <div className="mt-5 space-y-3">{visibleApplications.map((application) => {
              const job = application.jobId as unknown as { _id: string; companyName: string; role: string; location: string } | null;
              const status = application.status === "RECORDED" ? "APPLIED" : application.status;
              return job ? <div key={application._id.toString()} className="flex items-start justify-between gap-4 rounded-xl border p-4"><div><p className="font-semibold">{job.role}</p><p className="mt-1 text-sm text-muted">{job.companyName}</p><p className="mt-2 text-xs text-muted">{application.appliedAt ? new Date(application.appliedAt).toLocaleDateString() : "Date unavailable"}</p></div><div className="text-right"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status === "APPLIED" ? "bg-teal/10 text-teal" : "bg-secondary text-muted"}`}>{status}</span><Link href={`/jobs/${job._id}`} className="mt-3 block text-xs font-semibold text-teal">View job</Link></div></div> : null;
            })}</div>}
          </section>

          <section id="saved" className="rounded-2xl border bg-surface p-6">
            <div className="flex items-center justify-between"><h2 className="text-xl font-semibold">Recently Saved Jobs</h2><Link href="/dashboard#saved" className="text-sm font-semibold text-teal">View All</Link></div>
            {visibleSavedJobs.length === 0 ? <p className="mt-5 rounded-xl bg-secondary p-5 text-sm text-muted">No saved jobs yet.</p> : <div className="mt-5 space-y-3">{visibleSavedJobs.map((saved) => {
              const job = saved.jobId as unknown as { _id: string; companyName: string; role: string } | null;
              return job ? <div key={saved._id.toString()} className="flex items-center justify-between gap-4 rounded-xl border p-4"><div><p className="font-semibold">{job.role}</p><p className="mt-1 text-sm text-muted">{job.companyName}</p><p className="mt-2 text-xs text-muted">Saved {saved.savedAt ? new Date(saved.savedAt).toLocaleDateString() : ""}</p></div><Link href={`/jobs/${job._id}`} className="text-xs font-semibold text-teal">View job</Link></div> : null;
            })}</div>}
          </section>
        </div>

        <aside id="profile" className="h-fit rounded-2xl border bg-surface p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Personal information</p>
          <h2 className="mt-3 text-xl font-semibold">{user.name}</h2>
          <dl className="mt-5 space-y-3 text-sm"><div><dt className="text-muted">Email</dt><dd className="mt-1 break-all">{user.normalizedEmail}</dd></div>{user.phone && <div><dt className="text-muted">Phone</dt><dd className="mt-1">{user.phone}</dd></div>}<div><dt className="text-muted">Registered</dt><dd className="mt-1">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Unavailable"}</dd></div></dl>
          <ProfileEditor name={user.name} phone={user.phone} college={user.college} academicYear={user.academicYear} branch={user.branch} location={user.location} />

          <div className="mt-7 border-t pt-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Subscription</p>
            <h3 className="mt-3 text-lg font-semibold">{premium ? "Premium Plan" : "Free Plan"}</h3>
            <p className="mt-1 text-sm text-muted">Status: {premium ? "Active" : lastPayment?.status === "PENDING" ? "Pending" : lastPayment?.status === "REJECTED" ? "Rejected" : lastPayment?.status === "APPROVED" ? "Expired" : "Active"}</p>
            {premium ? <dl className="mt-4 space-y-2 text-sm"><div className="flex justify-between gap-3"><dt className="text-muted">Expires</dt><dd>{user.premiumExpiresAt?.toLocaleDateString()}</dd></div><div className="flex justify-between gap-3"><dt className="text-muted">Remaining</dt><dd>{remainingDays} days</dd></div></dl> : <p className="mt-4 text-sm leading-6 text-muted">Upgrade to unlock every opportunity.</p>}
            {lastPayment && <p className="mt-4 text-xs text-muted">Last purchased: {lastPayment.planId.replace("-", " ")} Premium</p>}
            {!premium && <Link href="/premium" className="mt-5 block rounded-xl bg-teal px-4 py-3 text-center text-sm font-semibold text-white">Upgrade to Premium</Link>}
          </div>
        </aside>
      </div>
    </main>
  );
}
