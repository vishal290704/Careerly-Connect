import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getCurrentUser } from "@/lib/user-auth";
import { connectToDatabase } from "@/lib/db";
import { Job } from "@/models/Job";
import { Application } from "@/models/Application";
import { hasValidCsrfToken } from "@/lib/security";
import { getPremiumStatus } from "@/lib/premium";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await getPremiumStatus(user)).active) return NextResponse.json({ error: "Premium subscription required." }, { status: 403 });
  const jobId = new URL(request.url).searchParams.get("jobId");
  if (jobId && !mongoose.isValidObjectId(jobId)) return NextResponse.json({ error: "Invalid job." }, { status: 400 });
  await connectToDatabase();
  if (jobId) {
    const application = await Application.findOne({ userId: user._id, jobId }).lean();
    return NextResponse.json({ application: application ? { status: application.status === "RECORDED" ? "APPLIED" : application.status, appliedAt: application.appliedAt, withdrawnAt: application.withdrawnAt } : null });
  }
  const applications = await Application.find({ userId: user._id }).populate("jobId", "companyName role location").sort({ updatedAt: -1 }).lean();
  return NextResponse.json({ applications });
}

export async function PATCH(request: Request) {
  if (!(await hasValidCsrfToken(request))) return NextResponse.json({ error: "Invalid request." }, { status: 403 });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await getPremiumStatus(user)).active) return NextResponse.json({ error: "Premium subscription required." }, { status: 403 });
  const { jobId } = await request.json() as { jobId?: string };
  if (!jobId || !mongoose.isValidObjectId(jobId)) return NextResponse.json({ error: "Invalid job." }, { status: 400 });
  await connectToDatabase();
  const application = await Application.findOneAndUpdate(
    { userId: user._id, jobId, status: { $ne: "WITHDRAWN" } },
    { $set: { status: "WITHDRAWN", withdrawnAt: new Date() } },
    { new: true },
  );
  if (!application) return NextResponse.json({ status: "WITHDRAWN" });
  return NextResponse.json({ status: "WITHDRAWN" });
}

export async function POST(request: Request) {
  if (!(await hasValidCsrfToken(request))) return NextResponse.json({ error: "Invalid request." }, { status: 403 });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in before applying." }, { status: 401 });
  if (!(await getPremiumStatus(user)).active) return NextResponse.json({ error: "Premium subscription required." }, { status: 403 });
  const { jobId } = await request.json() as { jobId?: string };
  if (!jobId || !mongoose.isValidObjectId(jobId)) return NextResponse.json({ error: "Invalid job." }, { status: 400 });
  await connectToDatabase();
  const session = await mongoose.startSession();
  try {
    let applyUrl = "";
    const status = "APPLIED";
    await session.withTransaction(async () => {
      const job = await Job.findOne({ _id: jobId, status: "PUBLISHED" }).session(session);
      if (!job) throw new Error("JOB_UNAVAILABLE");
      const premium = Boolean(user.premiumExpiresAt && user.premiumExpiresAt > new Date());
      await Application.findOneAndUpdate(
        { userId: user._id, jobId },
        { $set: { status: "APPLIED", appliedAt: new Date(), entitlementType: premium ? "PREMIUM" : "FREE" }, $unset: { withdrawnAt: 1 } },
        { upsert: true, new: true, session, setDefaultsOnInsert: true },
      );
      applyUrl = job.applyUrl;
    });
    return NextResponse.json({ applyUrl, status }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "JOB_UNAVAILABLE") return NextResponse.json({ error: "This job is no longer available." }, { status: 404 });
    if (message.includes("E11000")) return NextResponse.json({ status: "APPLIED" });
    console.error("application failed", error);
    return NextResponse.json({ error: "Unable to record this application." }, { status: 500 });
  } finally {
    await session.endSession();
  }
}
