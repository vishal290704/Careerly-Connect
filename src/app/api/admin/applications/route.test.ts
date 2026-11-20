import { beforeEach, describe, expect, it, vi } from "vitest";

const { isAdmin } = vi.hoisted(() => ({
  isAdmin: vi.fn(),
}));

vi.mock("@/lib/admin-auth", () => ({ isAdmin }));
vi.mock("@/lib/db", () => ({ connectToDatabase: vi.fn(async () => undefined) }));
vi.mock("@/models/Application", () => ({
  Application: {
    find: vi.fn(() => ({
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      lean: vi.fn(async () => []),
    })),
  },
}));

import { GET } from "./route";

describe("GET /api/admin/applications", () => {
  beforeEach(() => {
    isAdmin.mockReset();
  });

  it("rejects unauthenticated non-admin requests", async () => {
    isAdmin.mockResolvedValue(false);
    const response = await GET();
    expect(response.status).toBe(401);
  });

  it("allows authorized administrators", async () => {
    isAdmin.mockResolvedValue(true);
    const response = await GET();
    expect(response.status).toBe(200);
  });
});
