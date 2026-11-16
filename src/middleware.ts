import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

async function validToken(token: string | undefined, audience: "admin" | "user") {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!token || !secret) return false;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), { issuer: "applyora", audience, algorithms: ["HS256"] });
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
