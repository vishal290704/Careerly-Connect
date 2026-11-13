import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getCurrentUser } from "@/lib/user-auth";
import { connectToDatabase } from "@/lib/db";
import { Job } from "@/models/Job";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectToDatabase();
  const jobs = await Job.find({ _id: { $in: user.savedJobIds ?? [] }, status: "PUBLISHED" }).select("-applyUrl").lean();
  return NextResponse.json({ jobs });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  const { jobId } = await request.json() as { jobId?: string };
  if (!jobId || !mongoose.isValidObjectId(jobId)) return NextResponse.json({ error: "Invalid job." }, { status: 400 });
  await connectToDatabase();
  const job = await Job.exists({ _id: jobId, status: "PUBLISHED" });
  if (!job) return NextResponse.json({ error: "Job not found." }, { status: 404 });
  const saved = (user.savedJobIds ?? []).some((id: mongoose.Types.ObjectId) => id.toString() === jobId);
  if (saved) user.savedJobIds = (user.savedJobIds ?? []).filter((id: mongoose.Types.ObjectId) => id.toString() !== jobId);
  else user.savedJobIds = [...(user.savedJobIds ?? []), new mongoose.Types.ObjectId(jobId)];
  await user.save();
  return NextResponse.json({ saved: !saved });
}
