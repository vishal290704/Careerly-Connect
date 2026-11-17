import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Job } from "@/models/Job";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim();
  await connectToDatabase();
  const escaped = query ? query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") : "";
  const searchable = escaped ? [
    { role: { $regex: escaped, $options: "i" } },
    { companyName: { $regex: escaped, $options: "i" } },
    { location: { $regex: escaped, $options: "i" } },
    { category: { $regex: escaped, $options: "i" } },
    { description: { $regex: escaped, $options: "i" } },
    { requiredSkills: { $regex: escaped, $options: "i" } },
    { workMode: { $regex: escaped, $options: "i" } },
    { jobType: { $regex: escaped, $options: "i" } },
  ] : [];
  const filter = { status: "PUBLISHED", ...(searchable.length ? { $or: searchable } : {}) };
  const jobs = await Job.find(filter).sort({ publishedAt: -1, createdAt: -1 }).select("companyName role location stipend workMode jobType category description requiredSkills status publishedAt").lean();
  const response = NextResponse.json({ jobs });
  response.headers.set("Cache-Control", "public, s-maxage=30, stale-while-revalidate=120");
  return response;
}
