import { NextResponse } from "next/server";
import { cookieName } from "@/lib/admin-auth";

export async function POST() {
  const response = NextResponse.json({ message: "Logged out." });
  response.cookies.set(cookieName, "", { httpOnly: true, expires: new Date(0), path: "/" });
  return response;
}
