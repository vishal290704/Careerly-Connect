import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getCurrentUser } from "@/lib/user-auth";
import { connectToDatabase } from "@/lib/db";
import { Job } from "@/models/Job";
import { Application } from "@/models/Application";
import { hasValidCsrfToken } from "@/lib/security";

export async function POST(request: Request) {
  if (!(await hasValidCsrfToken(request))) return NextResponse.json({ error: "Invalid request." }, { status: 403 });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in before applying." }, { status: 401 });
  const { jobId } = await request.json() as { jobId?: string };
  if (!jobId || !mongoose.isValidObjectId(jobId)) return NextResponse.json({ error: "Invalid job." }, { status: 400 });
  await connectToDatabase();
  const session = await mongoose.startSession();
  try {
    let applyUrl = "";
    let entitlementType: "FREE" | "PREMIUM" = "FREE";
    await session.withTransaction(async () => {
      const job = await Job.findOne({ _id: jobId, status: "PUBLISHED" }).session(session);
      if (!job) throw new Error("JOB_UNAVAILABLE");
      const alreadyApplied = await Application.exists({ userId: user._id, jobId }).session(session);
      if (alreadyApplied) throw new Error("ALREADY_APPLIED");
      const premium = Boolean(user.premiumExpiresAt && user.premiumExpiresAt > new Date());
      entitlementType = premium ? "PREMIUM" : "FREE";
      if (!premium) {
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentApplications = await Application.countDocuments({ userId: user._id, appliedAt: { $gte: since } }).session(session);
        if (recentApplications >= 2) throw new Error("QUOTA_REACHED");
      }
      await Application.create([{ userId: user._id, jobId, entitlementType, appliedAt: new Date() }], { session });
      applyUrl = job.applyUrl;
    });
    return NextResponse.json({ applyUrl, entitlementType }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "JOB_UNAVAILABLE") return NextResponse.json({ error: "This job is no longer available." }, { status: 404 });
    if (message === "ALREADY_APPLIED") return NextResponse.json({ error: "You have already applied to this job." }, { status: 409 });
    if (message === "QUOTA_REACHED") return NextResponse.json({ error: "Free accounts can record two applications in a rolling 24-hour period. Upgrade to Premium for unlimited applications." }, { status: 429 });
    if (message.includes("E11000")) return NextResponse.json({ error: "You have already applied to this job." }, { status: 409 });
    console.error("application failed", error);
    return NextResponse.json({ error: "Unable to record this application." }, { status: 500 });
  } finally {
    await session.endSession();
  }
}
