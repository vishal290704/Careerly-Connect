import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/db";
import { Application } from "@/models/Application";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectToDatabase();
  const applications = await Application.find().populate("userId", "name normalizedEmail phone").populate("jobId", "companyName role location").sort({ appliedAt: -1 }).lean();
  return NextResponse.json({ applications });
}
