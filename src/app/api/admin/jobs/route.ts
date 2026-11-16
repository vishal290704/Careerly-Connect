import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { isAdmin } from "@/lib/admin-auth";
import { Job } from "@/models/Job";
import { hasValidCsrfToken } from "@/lib/security";

const jobSchema = z.object({
  companyName: z.string().min(2), role: z.string().min(2), location: z.string().min(2),
  stipend: z.string().min(1), workMode: z.enum(["Remote", "Hybrid", "On-site"]),
  jobType: z.enum(["Internship", "Full-time"]), category: z.string().min(2),
  description: z.string().min(20), applyUrl: z.string().url(), status: z.enum(["DRAFT", "PUBLISHED", "CLOSED"]).default("DRAFT"),
});

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectToDatabase();
  return NextResponse.json({ jobs: await Job.find().sort({ createdAt: -1 }).lean() });
}

export async function POST(request: Request) {
  if (!(await hasValidCsrfToken(request))) return NextResponse.json({ error: "Invalid request." }, { status: 403 });
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = jobSchema.parse(await request.json());
  await connectToDatabase();
  const job = await Job.create({ ...data, publishedAt: data.status === "PUBLISHED" ? new Date() : undefined });
  return NextResponse.json({ job }, { status: 201 });
}
