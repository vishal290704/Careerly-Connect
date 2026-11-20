import { beforeEach, describe, expect, it, vi } from "vitest";

const { getCurrentUser, findOne, paymentExists, paymentCreate } = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  findOne: vi.fn(),
  paymentExists: vi.fn(),
  paymentCreate: vi.fn(),
}));

vi.mock("@/lib/security", () => ({ hasValidCsrfToken: vi.fn(async () => true) }));
vi.mock("@/lib/user-auth", () => ({ getCurrentUser }));
vi.mock("@/lib/db", () => ({ connectToDatabase: vi.fn(async () => undefined) }));
vi.mock("@/models/User", () => ({ User: { findOne } }));
vi.mock("@/models/Payment", () => ({
  Payment: {
    exists: paymentExists,
    create: paymentCreate,
  },
}));

import { POST } from "./route";

function paymentForm(planId = "1-month", transactionId = "UTR123456789") {
  const form = new FormData();
  form.set("planId", planId);
  form.set("upiId", "user@bank");
  form.set("transactionId", transactionId);
  form.set("paymentProof", new File(["image"], "proof.png", { type: "image/png" }));
  return form;
}

describe("POST /api/payments", () => {
  beforeEach(() => {
    getCurrentUser.mockReset();
    findOne.mockReset();
    paymentExists.mockReset();
    paymentCreate.mockReset();
  });

  it("rejects unauthenticated submissions", async () => {
    getCurrentUser.mockResolvedValue(null);
    const response = await POST(new Request("http://localhost:3000/api/payments", {
      method: "POST",
      body: paymentForm(),
    }));
    expect(response.status).toBe(401);
  });

  it("rejects invalid plan identifiers", async () => {
    getCurrentUser.mockResolvedValue({ _id: "507f1f77bcf86cd799439011", referredBy: undefined });
    const response = await POST(new Request("http://localhost:3000/api/payments", {
      method: "POST",
      body: paymentForm("12-months"),
    }));
    expect(response.status).toBe(400);
  });

  it("rejects duplicate transaction IDs", async () => {
    getCurrentUser.mockResolvedValue({ _id: "507f1f77bcf86cd799439011", referredBy: undefined });
    paymentExists.mockResolvedValue({ _id: "existing-payment" });
    const response = await POST(new Request("http://localhost:3000/api/payments", {
      method: "POST",
      body: paymentForm(),
    }));
    expect(response.status).toBe(409);
  });

  it("submits a valid payment as pending for manual verification", async () => {
    const save = vi.fn(async () => undefined);
    getCurrentUser.mockResolvedValue({
      _id: "507f1f77bcf86cd799439011",
      referredBy: undefined,
      save,
    });
    paymentExists.mockResolvedValue(null);
    paymentCreate.mockResolvedValue({ _id: "payment-1" });

    const response = await POST(new Request("http://localhost:3000/api/payments", {
      method: "POST",
      body: paymentForm(),
    }));

    expect(response.status).toBe(201);
    expect(paymentCreate).toHaveBeenCalledOnce();
    expect(paymentCreate.mock.calls[0][0]).toMatchObject({
      planId: "1-month",
      transactionId: "UTR123456789",
      finalAmount: 84,
    });
  });

  it("rejects invalid and oversized payment proof types", async () => {
    getCurrentUser.mockResolvedValue({ _id: "507f1f77bcf86cd799439011", referredBy: undefined });
    const form = new FormData();
    form.set("planId", "1-month");
    form.set("upiId", "user@bank");
    form.set("transactionId", "UTR123456789");
    form.set("paymentProof", new File(["text"], "proof.txt", { type: "text/plain" }));
    const response = await POST(new Request("http://localhost:3000/api/payments", {
      method: "POST",
      body: form,
    }));
    expect(response.status).toBe(400);
  });
});
