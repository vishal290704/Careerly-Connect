import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getCurrentUser, getPremiumStatus, findApplication, findJob, updateApplication } = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  getPremiumStatus: vi.fn(),
  findApplication: vi.fn(),
  findJob: vi.fn(),
  updateApplication: vi.fn(),
}));

vi.mock("@/lib/user-auth", () => ({ getCurrentUser }));
vi.mock("@/lib/premium", () => ({ getPremiumStatus }));
vi.mock("@/lib/db", () => ({ connectToDatabase: vi.fn(async () => undefined) }));
vi.mock("@/lib/security", () => ({ hasValidCsrfToken: vi.fn(async () => true) }));
vi.mock("@/models/Job", () => ({
  Job: {
    findOne: findJob,
  },
}));
vi.mock("@/models/Application", () => ({
  Application: {
    findOne: findApplication,
    findOneAndUpdate: updateApplication,
    find: vi.fn(),
  },
}));

import { GET, POST, PATCH } from "./route";

describe("job applications API", () => {
  beforeEach(() => {
    getCurrentUser.mockReset();
    getPremiumStatus.mockReset();
    findApplication.mockReset();
    findJob.mockReset();
    updateApplication.mockReset();
  });

  it("rejects unauthenticated application history", async () => {
    getCurrentUser.mockResolvedValue(null);
    const response = await GET(new Request("http://localhost:3000/api/applications"));
    expect(response.status).toBe(401);
  });

  it("rejects application operations for Free users", async () => {
    getCurrentUser.mockResolvedValue({ _id: "507f1f77bcf86cd799439011" });
    getPremiumStatus.mockResolvedValue({ active: false });
    const response = await POST(new Request("http://localhost:3000/api/applications", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jobId: "507f1f77bcf86cd799439012" }),
    }));
    expect(response.status).toBe(403);
  });

  it("rejects malformed job identifiers", async () => {
    getCurrentUser.mockResolvedValue({ _id: "507f1f77bcf86cd799439011" });
    getPremiumStatus.mockResolvedValue({ active: true });
    const response = await POST(new Request("http://localhost:3000/api/applications", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jobId: "invalid" }),
    }));
    expect(response.status).toBe(400);
  });

  it("retrieves the current status for a valid application", async () => {
    getCurrentUser.mockResolvedValue({ _id: "507f1f77bcf86cd799439011" });
    getPremiumStatus.mockResolvedValue({ active: true });
    findApplication.mockReturnValue({ lean: vi.fn(async () => ({
      status: "APPLIED",
      appliedAt: new Date("2026-11-20"),
      withdrawnAt: undefined,
    })) });

    const response = await GET(new Request("http://localhost:3000/api/applications?jobId=507f1f77bcf86cd799439012"));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      application: { status: "APPLIED" },
    });
  });

  it("rejects withdrawal when the request has no valid job", async () => {
    getCurrentUser.mockResolvedValue({ _id: "507f1f77bcf86cd799439011" });
    getPremiumStatus.mockResolvedValue({ active: true });
    const response = await PATCH(new Request("http://localhost:3000/api/applications", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jobId: "invalid" }),
    }));
    expect(response.status).toBe(400);
  });

  it("creates or reactivates an application once through the unique upsert", async () => {
    getCurrentUser.mockResolvedValue({ _id: "507f1f77bcf86cd799439011", premiumExpiresAt: new Date("2026-12-20") });
    getPremiumStatus.mockResolvedValue({ active: true });
    findJob.mockReturnValue({
      session: vi.fn(async () => ({
        _id: "507f1f77bcf86cd799439012",
        applyUrl: "https://example.com/jobs/1",
      })),
    });
    updateApplication.mockResolvedValue({ _id: "application-1" });

    const session = {
      withTransaction: vi.fn(async (callback: () => Promise<void>) => callback()),
      endSession: vi.fn(async () => undefined),
    };
    vi.spyOn(mongoose, "startSession").mockResolvedValue(session as never);

    const response = await POST(new Request("http://localhost:3000/api/applications", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jobId: "507f1f77bcf86cd799439012" }),
    }));

    expect(response.status).toBe(200);
    expect(updateApplication).toHaveBeenCalledOnce();
  });
});
