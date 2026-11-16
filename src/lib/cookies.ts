import type { NextResponse } from "next/server";

export const userCookieName = "applyora_user";
export const refreshCookieName = "applyora_refresh";
export const adminCookieName = "applyora_admin";
export const csrfCookieName = "applyora_csrf";

export function authCookieOptions(maxAge: number, httpOnly = true) {
  return {
    httpOnly,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export function clearAuthCookies(response: NextResponse) {
  for (const name of [userCookieName, refreshCookieName, adminCookieName]) {
    response.cookies.set(name, "", { ...authCookieOptions(0), expires: new Date(0) });
  }
}
