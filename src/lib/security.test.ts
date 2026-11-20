import { beforeEach, describe, expect, it, vi } from "vitest";

const cookieStore = new Map<string, { value: string }>();

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) => cookieStore.get(name),
    set: (name: string, value: string) => cookieStore.set(name, { value }),
  })),
}));

import { hasValidOrigin, isRateLimited } from "@/lib/security";

describe("security utilities", () => {
  beforeEach(() => {
    cookieStore.clear();
  });

  it("accepts matching Origin headers", () => {
    expect(hasValidOrigin(new Request("https://careerly-connect.vercel.app/api/test", {
      headers: { origin: "https://careerly-connect.vercel.app" },
    }))).toBe(true);
  });

  it("rejects cross-origin requests", () => {
    expect(hasValidOrigin(new Request("https://careerly-connect.vercel.app/api/test", {
      headers: { origin: "https://malicious.example" },
    }))).toBe(false);
  });

  it("accepts matching Referer headers when Origin is absent", () => {
    expect(hasValidOrigin(new Request("https://careerly-connect.vercel.app/api/test", {
      headers: { referer: "https://careerly-connect.vercel.app/admin/login" },
    }))).toBe(true);
  });

  it("rate limits repeated requests and then allows a fresh window", () => {
    const request = new Request("https://careerly-connect.vercel.app/api/test", {
      headers: { "x-forwarded-for": "203.0.113.8" },
    });
    for (let attempt = 0; attempt < 3; attempt += 1) {
      expect(isRateLimited(request, "test-bucket", 2, 60_000)).toBe(attempt === 2);
    }
  });
});
