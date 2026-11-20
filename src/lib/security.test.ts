import { describe, expect, it } from "vitest";
import { hasValidOrigin, isRateLimited } from "./security";

describe("isRateLimited", () => {
  it("allows requests through the configured limit", () => {
    expect(isRateLimited(new Request("https://applyora.test/api/test", { headers: { "x-forwarded-for": "203.0.113.10" } }), "test", 2)).toBe(false);
    expect(isRateLimited(new Request("https://applyora.test/api/test", { headers: { "x-forwarded-for": "203.0.113.10" } }), "test", 2)).toBe(false);
  });

  it("rejects requests beyond the configured limit", () => {
    expect(isRateLimited(new Request("https://applyora.test/api/test", { headers: { "x-real-ip": "198.51.100.20" } }), "test-limit", 1)).toBe(false);
    expect(isRateLimited(new Request("https://applyora.test/api/test", { headers: { "x-real-ip": "198.51.100.20" } }), "test-limit", 1)).toBe(true);
  });
});

describe("hasValidOrigin", () => {
  it("accepts a matching origin", () => {
    const request = new Request("https://applyora.test/api/test", { headers: { origin: "https://applyora.test" } });
    expect(hasValidOrigin(request)).toBe(true);
  });

  it("rejects a different origin", () => {
    const request = new Request("https://applyora.test/api/test", { headers: { origin: "https://evil.example" } });
    expect(hasValidOrigin(request)).toBe(false);
  });

  it("rejects requests with no origin or referer", () => {
    expect(hasValidOrigin(new Request("https://applyora.test/api/test"))).toBe(false);
  });
});
