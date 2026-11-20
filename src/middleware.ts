import { NextRequest, NextResponse } from "next/server";

async function validToken(token: string | undefined, audience: "admin" | "user") {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!token || !secret) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  try {
    const [header, payloadPart, signaturePart] = parts;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    const decodeBase64Url = (value: string) => {
      const base64 = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - value.length % 4) % 4);
      return Uint8Array.from(Array.from(atob(base64), (character) => character.charCodeAt(0)));
    };
    const payload = JSON.parse(new TextDecoder().decode(decodeBase64Url(payloadPart))) as { role?: string; iss?: string; aud?: string | string[]; exp?: number };
    const headerPayload = JSON.parse(new TextDecoder().decode(decodeBase64Url(header))) as { alg?: string };
    if (headerPayload.alg !== "HS256") return false;
    const signature = decodeBase64Url(signaturePart);
    const valid = await crypto.subtle.verify("HMAC", key, signature, encoder.encode(`${header}.${payloadPart}`));
    if (!valid) return false;
    if (payload.iss !== "applyora" || (payload.exp !== undefined && payload.exp * 1000 <= Date.now())) return false;
    const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (!audiences.includes(audience)) return false;
    return audience === "admin" ? payload.role === "admin" : payload.role === "user";
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let protectedRoute = false;
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    protectedRoute = true;
    if (!(await validToken(request.cookies.get("applyora_admin")?.value, "admin"))) return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  if (pathname === "/dashboard" || pathname.startsWith("/referrals")) {
    protectedRoute = true;
    if (!(await validToken(request.cookies.get("applyora_user")?.value, "user"))) {
      if (request.cookies.get("applyora_refresh")?.value) {
        const refreshUrl = new URL("/api/auth/refresh", request.url);
        refreshUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
        return NextResponse.redirect(refreshUrl);
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }
  const response = NextResponse.next();
  if (protectedRoute) {
    response.headers.set("Cache-Control", "no-store, private");
    response.headers.set("Pragma", "no-cache");
  }
  if (!request.cookies.get("applyora_csrf")?.value) {
    response.cookies.set("applyora_csrf", crypto.randomUUID().replaceAll("-", ""), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
