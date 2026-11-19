import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { isAdmin } from "@/lib/admin-auth";
import { Job } from "@/models/Job";
import { hasValidCsrfToken } from "@/lib/security";

const importSchema = z.object({
  companyName: z.string().trim().min(2),
  role: z.string().trim().min(2),
  location: z.string().trim().min(2),
  stipend: z.string().trim().min(1),
  workMode: z.enum(["Remote", "Hybrid", "On-site"]),
  jobType: z.enum(["Internship", "Full-time"]),
  category: z.string().trim().min(2),
  description: z.string().trim().min(20),
  applyUrl: z.string().trim().url(),
  requiredSkills: z.array(z.string().trim()).optional().default([]),
  status: z.enum(["DRAFT", "PUBLISHED", "CLOSED"]).optional().default("PUBLISHED"),
});

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"') {
      if (quoted && text[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      row.push(value);
      value = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[index + 1] === "\n") index += 1;
      row.push(value);
      if (row.some((cell) => cell.trim() !== "")) rows.push(row);
      row = [];
      value = "";
    } else {
      value += char;
    }
  }

  if (value !== "" || row.length) {
    row.push(value);
    if (row.some((cell) => cell.trim() !== "")) rows.push(row);
  }
  return rows;
}

function normalizeHeader(header: string) {
  return header
    .replace(/^\uFEFF/, "")
    .trim()
    .replace(/[\s_-]+(.)/g, (_, char: string) => char.toUpperCase())
    .replace(/[\s_-]+/g, "");
}

export async function POST(request: Request) {
  if (!(await hasValidCsrfToken(request))) return NextResponse.json({ error: "Invalid request." }, { status: 403 });
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose a CSV file." }, { status: 400 });
  if (!file.name.toLowerCase().endsWith(".csv")) return NextResponse.json({ error: "Only CSV files are supported." }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "CSV file must be smaller than 5 MB." }, { status: 400 });

  const rows = parseCsv(await file.text());
  if (rows.length < 2) return NextResponse.json({ error: "The CSV has no job rows." }, { status: 400 });

  const headers = rows[0].map(normalizeHeader);
  const requiredHeaders = ["companyName", "role", "location", "stipend", "workMode", "jobType", "category", "description", "applyUrl"];
  const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header));
  if (missingHeaders.length) {
    return NextResponse.json({ error: `Missing CSV columns: ${missingHeaders.join(", ")}` }, { status: 400 });
  }

  await connectToDatabase();
  const seen = new Set<string>();
  const validJobs: z.infer<typeof importSchema>[] = [];
  let skipped = 0;

  for (const cells of rows.slice(1)) {
    if (cells.length !== headers.length) {
      skipped += 1;
      continue;
    }
    const raw = Object.fromEntries(headers.map((header, index) => [header, cells[index]?.trim() ?? ""]));
    const skills = String(raw.requiredSkills ?? "")
      .split(/[|;]/)
      .map((skill) => skill.trim())
      .filter(Boolean);
    const status = raw.status ? String(raw.status).toUpperCase() : "PUBLISHED";
    const parsed = importSchema.safeParse({ ...raw, requiredSkills: skills, status });
    if (!parsed.success) {
      skipped += 1;
      continue;
    }
    const job = parsed.data;
    const fingerprint = [
      job.companyName.toLowerCase(),
      job.role.toLowerCase(),
      job.location.toLowerCase(),
      job.applyUrl.toLowerCase(),
    ].join("|");
    if (seen.has(fingerprint)) {
      skipped += 1;
      continue;
    }
    seen.add(fingerprint);
    validJobs.push(job);
  }

  if (!validJobs.length) return NextResponse.json({ error: "No valid job rows were found.", skipped }, { status: 400 });

  const existing = await Job.find(
    {
      $or: validJobs.map((job) => ({
        companyName: job.companyName,
        role: job.role,
        location: job.location,
        applyUrl: job.applyUrl,
      })),
    },
    "companyName role location applyUrl",
  ).lean();

  const existingFingerprints = new Set(existing.map((job) =>
    [job.companyName.toLowerCase(), job.role.toLowerCase(), job.location.toLowerCase(), job.applyUrl.toLowerCase()].join("|"),
  ));
  const newJobs = validJobs.filter((job) => {
    const fingerprint = [job.companyName.toLowerCase(), job.role.toLowerCase(), job.location.toLowerCase(), job.applyUrl.toLowerCase()].join("|");
    if (existingFingerprints.has(fingerprint)) {
      skipped += 1;
      return false;
    }
    existingFingerprints.add(fingerprint);
    return true;
  });

  if (!newJobs.length) return NextResponse.json({ created: 0, skipped }, { status: 200 });

  const now = new Date();
  const created = await Job.insertMany(newJobs.map((job) => ({
    ...job,
    publishedAt: job.status === "PUBLISHED" ? now : undefined,
  })), { ordered: false });

  return NextResponse.json({ created: created.length, skipped }, { status: 201 });
}
