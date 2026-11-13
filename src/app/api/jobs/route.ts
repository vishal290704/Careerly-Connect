import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Job } from "@/models/Job";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim();
  await connectToDatabase();
  const filter = { status: "PUBLISHED", ...(query ? { $or: [
    { role: { $regex: query, $options: "i" } },
    { companyName: { $regex: query, $options: "i" } },
    { location: { $regex: query, $options: "i" } },
    { category: { $regex: query, $options: "i" } },
  ] } : {}) };
  const jobs = await Job.find(filter).sort({ publishedAt: -1, createdAt: -1 }).select("-applyUrl").lean();
  return NextResponse.json({ jobs });
}
