import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/user-auth";
import { connectToDatabase } from "@/lib/db";
import { Application } from "@/models/Application";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectToDatabase();
  const applications = await Application.find({ userId: user._id }).populate("jobId", "companyName role location").sort({ appliedAt: -1 }).lean();
  return NextResponse.json({ applications });
}
