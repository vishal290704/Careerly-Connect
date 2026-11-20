import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { isAdmin, findOneAndUpdate } = vi.hoisted(() => ({
  isAdmin: vi.fn(),
  findOneAndUpdate: vi.fn(),
}));

vi.mock("@/lib/admin-auth", () => ({ isAdmin }));
vi.mock("@/lib/db", () => ({ connectToDatabase: vi.fn(async () => undefined) }));
vi.mock("@/lib/security", () => ({ hasValidCsrfToken: vi.fn(async () => true) }));
vi.mock("@/models/Payment", () => ({ Payment: { findOneAndUpdate } }));
vi.mock("@/models/User", () => ({ User: { findById: vi.fn() } }));
vi.mock("@/lib/referrals", () => ({
  ensureReferralCode: vi.fn(),
  processReferralReward: vi.fn(),
}));

import { PATCH } from "./route";

describe("PATCH /api/admin/payments/[id]", () => {
  beforeEach(() => {
    isAdmin.mockReset();
    findOneAndUpdate.mockReset();
  });

  it("rejects unauthorized administrators", async () => {
    isAdmin.mockResolvedValue(false);
    const response = await PATCH(new Request("http://localhost:3000/api/admin/payments/507f1f77bcf86cd799439011", {
      method: "PATCH",
      body: JSON.stringify({ status: "APPROVED" }),
    }), { params: Promise.resolve({ id: "507f1f77bcf86cd799439011" }) });
    expect(response.status).toBe(401);
  });

  it("rejects malformed payment identifiers", async () => {
    isAdmin.mockResolvedValue(true);
    const response = await PATCH(new Request("http://localhost:3000/api/admin/payments/invalid", {
      method: "PATCH",
      body: JSON.stringify({ status: "APPROVED" }),
    }), { params: Promise.resolve({ id: "invalid" }) });
    expect(response.status).toBe(400);
  });

  it("rejects invalid review statuses", async () => {
    isAdmin.mockResolvedValue(true);
    const response = await PATCH(new Request("http://localhost:3000/api/admin/payments/507f1f77bcf86cd799439011", {
      method: "PATCH",
      body: JSON.stringify({ status: "UNKNOWN" }),
    }), { params: Promise.resolve({ id: "507f1f77bcf86cd799439011" }) });
    expect(response.status).toBe(400);
  });

  it("records a rejected payment without activating Premium", async () => {
    isAdmin.mockResolvedValue(true);
    const payment = {
      _id: "507f1f77bcf86cd799439011",
      planId: "1-month",
      status: "REJECTED",
      save: vi.fn(async () => undefined),
    };
    findOneAndUpdate.mockResolvedValue(payment);
    const session = {
      withTransaction: vi.fn(async (callback: () => Promise<void>) => callback()),
      endSession: vi.fn(async () => undefined),
    };
    vi.spyOn(mongoose, "startSession").mockResolvedValue(session as never);

    const response = await PATCH(new Request("http://localhost:3000/api/admin/payments/507f1f77bcf86cd799439011", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "REJECTED", rejectionReason: "Proof was invalid" }),
    }), { params: Promise.resolve({ id: "507f1f77bcf86cd799439011" }) });

    expect(response.status).toBe(200);
    expect(findOneAndUpdate).toHaveBeenCalledOnce();
  });
});
