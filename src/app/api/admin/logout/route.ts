import { NextResponse } from "next/server";
import { cookieName, revokeAdminSession } from "@/lib/admin-auth";
import { cookies } from "next/headers";
import { hasValidOrigin } from "@/lib/security";

export async function POST(request: Request) {
  if (!hasValidOrigin(request)) return NextResponse.json({ error: "Invalid request." }, { status: 403 });
  await revokeAdminSession((await cookies()).get(cookieName)?.value);
  const response = NextResponse.json({ message: "Logged out." });
  response.cookies.set(cookieName, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", expires: new Date(0), path: "/" });
  return response;
}
