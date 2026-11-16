const attempts = new Map<string, { count: number; resetAt: number }>();

export function isRateLimited(request: Request, bucket: string, limit = 8, windowMs = 10 * 60 * 1000) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || request.headers.get("x-real-ip") || "unknown";
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  current.count += 1;
  return current.count > limit;
}

export function hasValidOrigin(request: Request) {
  try {
    const requestOrigin = new URL(request.url).origin;
    const origin = request.headers.get("origin");
    if (origin) return origin === requestOrigin;
    const referer = request.headers.get("referer");
    return Boolean(referer && new URL(referer).origin === requestOrigin);
  } catch {
    return false;
  }
}

export async function createCsrfToken() {
  const token = randomBytes(32).toString("hex");
  (await cookies()).set("applyora_csrf", token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  return token;
}

export async function hasValidCsrfToken(request: Request) {
  if (!hasValidOrigin(request)) return false;
  const header = request.headers.get("x-csrf-token");
  const cookie = (await cookies()).get("applyora_csrf")?.value;
  if (!header || !cookie || header.length !== cookie.length) return false;
  return timingSafeEqual(Buffer.from(header), Buffer.from(cookie));
}
import { randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
