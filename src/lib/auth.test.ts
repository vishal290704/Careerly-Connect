import { describe, expect, it } from "vitest";
import argon2 from "argon2";
import { jwtVerify, SignJWT } from "jose";

describe("authentication primitives", () => {
  it("hashes and verifies a password with Argon2", async () => {
    const hash = await argon2.hash("test-password");
    expect(hash).not.toBe("test-password");
    await expect(argon2.verify(hash, "test-password")).resolves.toBe(true);
    await expect(argon2.verify(hash, "wrong-password")).resolves.toBe(false);
  });

  it("accepts a valid user JWT", async () => {
    const secret = new TextEncoder().encode("ci-only-test-secret-not-for-production");
    const token = await new SignJWT({ sub: "user-1", role: "user", ver: 0 })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuer("applyora")
      .setAudience("user")
      .setExpirationTime("5m")
      .sign(secret);
    const { payload } = await jwtVerify(token, secret, {
      issuer: "applyora",
      audience: "user",
      algorithms: ["HS256"],
    });
    expect(payload.sub).toBe("user-1");
  });

  it("rejects malformed JWTs", async () => {
    const secret = new TextEncoder().encode("ci-only-test-secret-not-for-production");
    await expect(jwtVerify("not-a-jwt", secret)).rejects.toThrow();
  });

  it("rejects expired JWTs", async () => {
    const secret = new TextEncoder().encode("ci-only-test-secret-not-for-production");
    const token = await new SignJWT({ sub: "user-1", role: "user" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuer("applyora")
      .setAudience("user")
      .setExpirationTime("-1s")
      .sign(secret);
    await expect(jwtVerify(token, secret, {
      issuer: "applyora",
      audience: "user",
      algorithms: ["HS256"],
    })).rejects.toThrow();
  });
});
