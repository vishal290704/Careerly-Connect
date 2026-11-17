import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/user-auth";
import { connectToDatabase } from "@/lib/db";
import { Application } from "@/models/Application";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectToDatabase();
  const applications = await Application.find({ userId: user._id }).populate("jobId", "companyName role location").sort({ updatedAt: -1 }).lean();
  const activeCount = await Application.countDocuments({ userId: user._id, status: { $in: ["APPLIED", "RECORDED"] } });
  return NextResponse.json({ applications, activeCount });
}
