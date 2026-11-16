import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { cookieName, getCurrentUser, revokeAllRefreshSessions, revokeRefreshSession } from "@/lib/user-auth";
import { refreshCookieName } from "@/lib/cookies";
import { hasValidCsrfToken } from "@/lib/security";

export async function POST(request: Request) {
  if (!(await hasValidCsrfToken(request))) return NextResponse.json({ error: "Invalid request." }, { status: 403 });
  const user = await getCurrentUser();
  const refreshToken = (await cookies()).get(refreshCookieName)?.value;
  await revokeRefreshSession(refreshToken);
  if (user) {
    user.sessionVersion = (user.sessionVersion ?? 0) + 1;
    await user.save();
    await revokeAllRefreshSessions(user.id);
  }
  const response = NextResponse.json({ message: "Logged out." });
  response.cookies.set(cookieName, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", expires: new Date(0), path: "/" });
  response.cookies.set(refreshCookieName, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", expires: new Date(0), path: "/" });
  return response;
}
