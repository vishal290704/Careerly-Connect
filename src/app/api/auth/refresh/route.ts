import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { hasValidOrigin } from "@/lib/security";
import { createUserSession, refreshCookieName, rotateRefreshSession, setUserCookies } from "@/lib/user-auth";

export async function GET(request: Request) {
  if (!hasValidOrigin(request)) return NextResponse.redirect(new URL("/login", request.url));
  const rawToken = (await cookies()).get(refreshCookieName)?.value;
  const rotated = rawToken ? await rotateRefreshSession(rawToken) : null;
  if (!rotated) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.set(refreshCookieName, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", expires: new Date(0), path: "/" });
    return response;
  }
  const accessToken = await createUserSession(rotated.user.id);
  const requestedNext = new URL(request.url).searchParams.get("next") || "/dashboard";
  const nextPath = requestedNext.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : "/dashboard";
  const response = NextResponse.redirect(new URL(nextPath, request.url));
  setUserCookies(response, accessToken, rotated.refreshToken);
  return response;
}
