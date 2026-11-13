import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";

const cookieName = "applyora_admin";

function secret() {
  const value = process.env.JWT_ACCESS_SECRET ?? process.env.ADMIN_BOOTSTRAP_PASSWORD;
  if (!value) throw new Error("JWT_ACCESS_SECRET is not configured");
  return new TextEncoder().encode(value);
}

export async function createAdminSession(username: string) {
  return new SignJWT({ username, role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .setIssuer("applyora")
    .setAudience("admin")
    .sign(secret());
}

export async function isAdmin() {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secret(), { issuer: "applyora", audience: "admin" });
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export { cookieName };
