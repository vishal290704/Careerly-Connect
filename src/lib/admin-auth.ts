import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import { randomUUID } from "node:crypto";
import { connectToDatabase } from "@/lib/db";
import { AdminSession } from "@/models/AdminSession";

const cookieName = "applyora_admin";

function secret() {
  const value = process.env.JWT_ACCESS_SECRET;
  if (!value) throw new Error("JWT_ACCESS_SECRET is not configured");
  return new TextEncoder().encode(value);
}

export async function createAdminSession(username: string) {
  const sessionId = randomUUID();
  await connectToDatabase();
  await AdminSession.create({ sessionId, expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000) });
  return new SignJWT({ username, role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .setJti(sessionId)
    .setIssuer("applyora")
    .setAudience("admin")
    .sign(secret());
}

export async function isAdmin() {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secret(), { issuer: "applyora", audience: "admin" });
    if (payload.role !== "admin" || !payload.jti) return false;
    await connectToDatabase();
    return Boolean(await AdminSession.exists({ sessionId: payload.jti, revokedAt: { $exists: false }, expiresAt: { $gt: new Date() } }));
  } catch {
    return false;
  }
}

export async function revokeAdminSession(token: string | undefined) {
  if (!token) return;
  try {
    const { payload } = await jwtVerify(token, secret(), { issuer: "applyora", audience: "admin" });
    if (payload.jti) {
      await connectToDatabase();
      await AdminSession.updateOne({ sessionId: payload.jti }, { $set: { revokedAt: new Date() } });
    }
  } catch {
    // Cookie clearing remains the safe fallback for malformed or expired tokens.
  }
}
export { cookieName };
