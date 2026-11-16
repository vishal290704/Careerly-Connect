import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import { User } from "@/models/User";
import { connectToDatabase } from "@/lib/db";
import { createHash, randomBytes } from "node:crypto";
import { UserSession } from "@/models/UserSession";
import { authCookieOptions, refreshCookieName, userCookieName } from "@/lib/cookies";
import type { NextResponse } from "next/server";

const cookieName = userCookieName;
const accessMaxAge = 15 * 60;
const refreshMaxAge = 30 * 24 * 60 * 60;

function secret() {
  const value = process.env.JWT_ACCESS_SECRET;
  if (!value) throw new Error("JWT_ACCESS_SECRET is not configured");
  return new TextEncoder().encode(value);
}

export async function createUserSession(userId: string) {
  await connectToDatabase();
  const user = await User.findById(userId).select("sessionVersion");
  return new SignJWT({ sub: userId, role: "user", ver: user?.sessionVersion ?? 0 })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .setIssuer("applyora")
    .setAudience("user")
    .sign(secret());
}

export async function getCurrentUser() {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { issuer: "applyora", audience: "user", algorithms: ["HS256"] });
    if (!payload.sub) return null;
    await connectToDatabase();
    const user = await User.findById(payload.sub);
    if (!user || payload.ver !== (user.sessionVersion ?? 0)) return null;
    return user;
  } catch {
    return null;
  }
}

export async function createRefreshSession(userId: string) {
  await connectToDatabase();
  const rawToken = randomBytes(48).toString("base64url");
  await UserSession.create({
    userId,
    familyId: randomBytes(16).toString("hex"),
    refreshTokenHash: createHash("sha256").update(rawToken).digest("hex"),
    expiresAt: new Date(Date.now() + refreshMaxAge * 1000),
    lastUsedAt: new Date(),
  });
  return rawToken;
}

export async function rotateRefreshSession(rawToken: string) {
  await connectToDatabase();
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const now = new Date();
  const current = await UserSession.findOneAndUpdate(
    { refreshTokenHash: tokenHash, revokedAt: { $exists: false }, expiresAt: { $gt: now } },
    { $set: { revokedAt: now, lastUsedAt: now } },
    { new: true },
  );
  if (!current) {
    const previous = await UserSession.findOne({ refreshTokenHash: tokenHash }).select("familyId");
    if (previous) await UserSession.updateMany({ familyId: previous.familyId, revokedAt: { $exists: false } }, { $set: { revokedAt: now } });
    return null;
  }
  const replacement = await createRefreshSession(current.userId.toString());
  const replacementHash = createHash("sha256").update(replacement).digest("hex");
  await UserSession.updateOne({ refreshTokenHash: tokenHash }, { $set: { replacedByHash: replacementHash, familyId: current.familyId } });
  const user = await User.findById(current.userId);
  return user ? { user, refreshToken: replacement } : null;
}

export async function revokeRefreshSession(rawToken: string | undefined) {
  if (!rawToken) return;
  await connectToDatabase();
  await UserSession.updateOne({ refreshTokenHash: createHash("sha256").update(rawToken).digest("hex"), revokedAt: { $exists: false } }, { $set: { revokedAt: new Date() } });
}

export async function revokeAllRefreshSessions(userId: string) {
  await connectToDatabase();
  await UserSession.updateMany({ userId, revokedAt: { $exists: false } }, { $set: { revokedAt: new Date() } });
}

export function setUserCookies(response: NextResponse, accessToken: string, refreshToken: string) {
  response.cookies.set(cookieName, accessToken, authCookieOptions(accessMaxAge));
  response.cookies.set(refreshCookieName, refreshToken, authCookieOptions(refreshMaxAge));
}

export { cookieName, refreshCookieName };
