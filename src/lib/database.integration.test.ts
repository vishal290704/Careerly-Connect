import mongoose from "mongoose";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const cookieStore = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => cookieStore.has(name) ? { name, value: cookieStore.get(name)! } : undefined,
  }),
}));

import { AdminSession } from "@/models/AdminSession";
import { Application } from "@/models/Application";
import { Job } from "@/models/Job";
import { User } from "@/models/User";
import { POST as adminLogin } from "@/app/api/admin/login/route";
import { GET as adminJobsGet, POST as adminJobsCreate } from "@/app/api/admin/jobs/route";
import { parseCsv } from "@/lib/csv";
import { GET as applicationGet, POST as applicationCreate } from "@/app/api/applications/route";

const testUri = process.env.TEST_MONGODB_URI;
const describeIntegration = testUri ? describe : describe.skip;

describeIntegration("isolated MongoDB integration", () => {
  beforeAll(async () => {
    process.env.MONGODB_URI = testUri;
    process.env.JWT_ACCESS_SECRET = "isolated-integration-secret";
    process.env.ADMIN_BOOTSTRAP_USERNAME = "integration-admin";
    process.env.ADMIN_BOOTSTRAP_PASSWORD = "integration-password";
    await mongoose.connect(testUri!, { dbName: "applyora_integration_test" });
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  it("authenticates admin credentials and creates an isolated admin session", async () => {
    const request = new Request("http://localhost/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json", origin: "http://localhost" },
      body: JSON.stringify({ username: "integration-admin", password: "integration-password" }),
    });
    const response = await adminLogin(request);
    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("applyora_admin=");
    expect(await AdminSession.countDocuments()).toBe(1);

    const rejected = await adminLogin(new Request("http://localhost/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json", origin: "http://localhost" },
      body: JSON.stringify({ username: "integration-admin", password: "wrong" }),
    }));
    expect(rejected.status).toBe(401);
  });

  it("rejects unauthorized admin API requests", async () => {
    expect((await adminJobsGet()).status).toBe(401);
  });

  it("creates and updates jobs and rejects database validation errors", async () => {
    const job = await Job.create({
      companyName: "Integration Company", role: "QA Engineer", location: "Remote", stipend: "₹50000",
      workMode: "Remote", jobType: "Full-time", category: "Engineering",
      description: "An integration test job with enough description text.", applyUrl: "https://example.com/apply",
      status: "PUBLISHED", publishedAt: new Date(),
    });
    expect(job.status).toBe("PUBLISHED");
    job.role = "Senior QA Engineer";
    await job.save();
    expect((await Job.findById(job._id))?.role).toBe("Senior QA Engineer");
    await expect(Job.create({ companyName: "Invalid" })).rejects.toThrow();

    const unauthorized = await adminJobsCreate(new Request("http://localhost/api/admin/jobs", {
      method: "POST", headers: { "content-type": "application/json", origin: "http://localhost" }, body: JSON.stringify({}),
    }));
    expect([403, 401]).toContain(unauthorized.status);
  });

  it("parses quoted CSV fields and malformed rows", () => {
    const csv = [
      "companyName,role,location,stipend,workMode,jobType,category,description,applyUrl,status",
      "\"CSV, Inc.\",Data Analyst,Delhi,₹40k,Hybrid,Full-time,Analytics,Valid CSV job description with enough text,https://example.com/csv,PUBLISHED",
      "invalid,row",
    ].join("\n");
    const rows = parseCsv(csv);
    expect(rows).toHaveLength(3);
    expect(rows[1][0]).toBe("CSV, Inc.");
    expect(rows[2]).toEqual(["invalid", "row"]);
  });

  it("records applications and enforces unique user/job constraints", async () => {
    const user = await User.create({
      name: "Test User", normalizedEmail: "integration-user@example.test", college: "Test College",
      passwordHash: "test-only", phone: "9999999999", academicYear: "2026", branch: "QA", location: "India",
    });
    const job = await Job.create({
      companyName: "Application Company", role: "Backend Engineer", location: "Remote", stipend: "₹60k",
      workMode: "Remote", jobType: "Full-time", category: "Engineering",
      description: "Application integration test description.", applyUrl: "https://example.com/backend", status: "PUBLISHED",
    });
    await Application.create({ userId: user._id, jobId: job._id, entitlementType: "PREMIUM", status: "APPLIED" });
    await expect(Application.create({ userId: user._id, jobId: job._id, entitlementType: "PREMIUM", status: "APPLIED" })).rejects.toThrow();
  });

  it("rejects unauthorized application requests", async () => {
    expect((await applicationGet(new Request("http://localhost/api/applications"))).status).toBe(401);
    const response = await applicationCreate(new Request("http://localhost/api/applications", {
      method: "POST", headers: { "content-type": "application/json", origin: "http://localhost" },
      body: JSON.stringify({ jobId: "invalid" }),
    }));
    expect([403, 401]).toContain(response.status);
  });

  it("rejects invalid user and job records", async () => {
    await expect(User.create({ name: "Incomplete" })).rejects.toThrow();
    await expect(Job.create({ companyName: "bad", role: "bad", location: "bad", workMode: "invalid" })).rejects.toThrow();
  });
});
