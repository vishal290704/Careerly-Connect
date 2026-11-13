import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import { createAdminSession, cookieName } from "@/lib/admin-auth";
import { z } from "zod";

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json") ? await request.json() : Object.fromEntries((await request.formData()).entries());
  const data = z.object({ username: z.string().min(1), password: z.string().min(1) }).parse(body);
  if (data.username !== process.env.ADMIN_BOOTSTRAP_USERNAME || data.password !== process.env.ADMIN_BOOTSTRAP_PASSWORD) {
    if (!contentType.includes("application/json")) return NextResponse.redirect(new URL("/admin/login?error=invalid", request.url));
    return NextResponse.json({ error: "Invalid administrator credentials." }, { status: 401 });
  }
  const token = await createAdminSession(data.username);
  if (!contentType.includes("application/json")) {
    const response = NextResponse.redirect(new URL("/admin/dashboard", request.url));
    response.cookies.set(cookieName, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 8 });
    return response;
  }
  const response = NextResponse.json({ message: "Logged in." });
  response.cookies.set(cookieName, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 8 });
  return response;
}
