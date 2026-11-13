import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import { User } from "@/models/User";
import { connectToDatabase } from "@/lib/db";

const cookieName = "applyora_user";

function secret() {
  const value = process.env.JWT_ACCESS_SECRET;
  if (!value) throw new Error("JWT_ACCESS_SECRET is not configured");
  return new TextEncoder().encode(value);
}

export async function createUserSession(userId: string) {
  return new SignJWT({ sub: userId, role: "user" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("2h")
    .setIssuer("applyora")
    .setAudience("user")
    .sign(secret());
}

export async function getCurrentUser() {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { issuer: "applyora", audience: "user" });
    if (!payload.sub) return null;
    await connectToDatabase();
    return User.findById(payload.sub);
  } catch {
    return null;
  }
}

export { cookieName };
