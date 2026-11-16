import { NextResponse } from "next/server";
import argon2 from "argon2";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { cookieName, createUserSession } from "@/lib/user-auth";
import { hasValidOrigin, isRateLimited } from "@/lib/security";

export async function POST(request: Request) {
  if (!hasValidOrigin(request)) return NextResponse.json({ error: "Invalid request." }, { status: 403 });
  if (isRateLimited(request, "user-login")) return NextResponse.json({ error: "Too many login attempts. Please try again later." }, { status: 429 });
  const contentType = request.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json") ? await request.json() : Object.fromEntries((await request.formData()).entries());
  const parsed = z.object({ email: z.string().email(), password: z.string().min(1) }).safeParse(body);
  if (!parsed.success) {
    if (!contentType.includes("application/json")) return NextResponse.redirect(new URL("/login?error=invalid", request.url));
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }
  const data = parsed.data;
  await connectToDatabase();
  const user = await User.findOne({ normalizedEmail: data.email.toLowerCase() });
  if (!user || !(await argon2.verify(user.passwordHash, data.password))) {
    if (!contentType.includes("application/json")) return NextResponse.redirect(new URL("/login?error=invalid", request.url));
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }
  user.sessionVersion = (user.sessionVersion ?? 0) + 1;
  await user.save();
  const response = NextResponse.json({ message: "Logged in." });
  response.cookies.set(cookieName, await createUserSession(user.id), {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 2,
  });
  if (!contentType.includes("application/json")) {
    const redirectResponse = NextResponse.redirect(new URL("/dashboard", request.url));
    redirectResponse.cookies.set(cookieName, await createUserSession(user.id), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 2 });
    return redirectResponse;
  }
  return response;
}
