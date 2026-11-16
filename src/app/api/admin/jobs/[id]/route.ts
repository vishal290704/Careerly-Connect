import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { isAdmin } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/db";
import { Job } from "@/models/Job";
import { hasValidCsrfToken } from "@/lib/security";

const jobSchema = z.object({
  companyName: z.string().min(2), role: z.string().min(2), location: z.string().min(2),
  stipend: z.string().min(1), workMode: z.enum(["Remote", "Hybrid", "On-site"]),
  jobType: z.enum(["Internship", "Full-time"]), category: z.string().min(2),
  description: z.string().min(20), applyUrl: z.string().url(), status: z.enum(["DRAFT", "PUBLISHED", "CLOSED"]),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await hasValidCsrfToken(request))) return NextResponse.json({ error: "Invalid request." }, { status: 403 });
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: "Invalid job." }, { status: 400 });
  const data = jobSchema.parse(await request.json());
  await connectToDatabase();
  const job = await Job.findByIdAndUpdate(id, { ...data, publishedAt: data.status === "PUBLISHED" ? new Date() : undefined }, { new: true, runValidators: true });
  if (!job) return NextResponse.json({ error: "Job not found." }, { status: 404 });
  return NextResponse.json({ job });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await hasValidCsrfToken(request))) return NextResponse.json({ error: "Invalid request." }, { status: 403 });
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: "Invalid job." }, { status: 400 });
  await connectToDatabase();
  const job = await Job.findByIdAndUpdate(id, { status: "CLOSED" }, { new: true });
  if (!job) return NextResponse.json({ error: "Job not found." }, { status: 404 });
  return NextResponse.json({ message: "Job closed and removed from public listings." });
}
