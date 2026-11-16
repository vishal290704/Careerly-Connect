import { NextResponse } from "next/server";
import { cookieName, getCurrentUser } from "@/lib/user-auth";
import { hasValidOrigin } from "@/lib/security";

export async function POST(request: Request) {
  if (!hasValidOrigin(request)) return NextResponse.json({ error: "Invalid request." }, { status: 403 });
  const user = await getCurrentUser();
  if (user) {
    user.sessionVersion = (user.sessionVersion ?? 0) + 1;
    await user.save();
  }
  const response = NextResponse.json({ message: "Logged out." });
  response.cookies.set(cookieName, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", expires: new Date(0), path: "/" });
  return response;
}
