import { beforeEach, describe, expect, it, vi } from "vitest";

const { verifyPassword, findUser, createUserSession, createRefreshSession, setUserCookies } = vi.hoisted(() => ({
  verifyPassword: vi.fn(),
  findUser: vi.fn(),
  createUserSession: vi.fn(async () => "access-token"),
  createRefreshSession: vi.fn(async () => "refresh-token"),
  setUserCookies: vi.fn(),
}));

vi.mock("argon2", () => ({
  default: { verify: verifyPassword },
}));
vi.mock("@/lib/db", () => ({ connectToDatabase: vi.fn(async () => undefined) }));
vi.mock("@/models/User", () => ({ User: { findOne: findUser } }));
vi.mock("@/lib/user-auth", () => ({
  createUserSession,
  createRefreshSession,
  setUserCookies,
}));
vi.mock("@/lib/security", () => ({
  hasValidOrigin: vi.fn(() => true),
  isRateLimited: vi.fn(() => false),
}));

import { POST } from "./route";

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    verifyPassword.mockReset();
    findUser.mockReset();
  });

  it("logs in a user with valid credentials", async () => {
    findUser.mockResolvedValue({
      id: "user-1",
      sessionVersion: 2,
      save: vi.fn(async () => undefined),
      passwordHash: "stored-hash",
    });
    verifyPassword.mockResolvedValue(true);

    const response = await POST(new Request("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "user@example.com", password: "valid-password" }),
    }));

    expect(response.status).toBe(200);
    expect(createUserSession).toHaveBeenCalledWith("user-1");
    expect(createRefreshSession).toHaveBeenCalledWith("user-1");
    expect(setUserCookies).toHaveBeenCalledOnce();
  });

  it("rejects an unknown email", async () => {
    findUser.mockResolvedValue(null);
    const response = await POST(new Request("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "missing@example.com", password: "valid-password" }),
    }));
    expect(response.status).toBe(401);
  });

  it("rejects an invalid password", async () => {
    findUser.mockResolvedValue({
      id: "user-1",
      sessionVersion: 0,
      save: vi.fn(async () => undefined),
      passwordHash: "stored-hash",
    });
    verifyPassword.mockResolvedValue(false);
    const response = await POST(new Request("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "user@example.com", password: "wrong-password" }),
    }));
    expect(response.status).toBe(401);
  });

  it("rejects malformed input", async () => {
    const response = await POST(new Request("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "not-an-email", password: "" }),
    }));
    expect(response.status).toBe(401);
  });
});
