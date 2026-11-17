import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getCurrentUser } from "@/lib/user-auth";
import { connectToDatabase } from "@/lib/db";
import { Job } from "@/models/Job";
import { hasValidCsrfToken } from "@/lib/security";
import { SavedJob } from "@/models/SavedJob";
import { User } from "@/models/User";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectToDatabase();
  if ((user.savedJobIds ?? []).length) {
    await SavedJob.bulkWrite((user.savedJobIds ?? []).map((jobId: mongoose.Types.ObjectId) => ({
      updateOne: { filter: { userId: user._id, jobId }, update: { $setOnInsert: { userId: user._id, jobId, savedAt: new Date() } }, upsert: true },
    })));
  }
  const saved = await SavedJob.find({ userId: user._id }).populate("jobId").sort({ savedAt: -1 }).lean();
  const jobs = saved
    .map((item) => item.jobId)
    .filter((job): job is NonNullable<typeof job> => Boolean(job) && (job as { status?: string }).status === "PUBLISHED")
    .map((job) => {
      const record = job as { _id: mongoose.Types.ObjectId; companyName: string; role: string; location: string; workMode: string; jobType: string; stipend: string; category: string; createdAt: Date };
      return { id: record._id.toString(), company: record.companyName, role: record.role, location: record.location, mode: record.workMode, type: record.jobType, pay: record.stipend, category: record.category, posted: "Saved", batch: "Open to eligible applicants" };
    });
  return NextResponse.json({ jobs, count: jobs.length });
}

export async function POST(request: Request) {
  if (!(await hasValidCsrfToken(request))) return NextResponse.json({ error: "Invalid request." }, { status: 403 });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  const { jobId } = await request.json() as { jobId?: string };
  if (!jobId || !mongoose.isValidObjectId(jobId)) return NextResponse.json({ error: "Invalid job." }, { status: 400 });
  await connectToDatabase();
  const job = await Job.exists({ _id: jobId, status: "PUBLISHED" });
  if (!job) return NextResponse.json({ error: "Job not found." }, { status: 404 });
  const existing = await SavedJob.findOne({ userId: user._id, jobId });
  if (existing) {
    await SavedJob.deleteOne({ _id: existing._id });
    await User.updateOne({ _id: user._id }, { $pull: { savedJobIds: job._id } });
    return NextResponse.json({ saved: false });
  }
  try {
    await SavedJob.create({ userId: user._id, jobId });
    await User.updateOne({ _id: user._id }, { $addToSet: { savedJobIds: job._id } });
    return NextResponse.json({ saved: true }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("E11000")) return NextResponse.json({ saved: true });
    throw error;
  }
}
