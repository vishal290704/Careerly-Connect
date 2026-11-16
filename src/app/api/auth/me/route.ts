import { NextResponse } from "next/server";
import { cookieName, getCurrentUser } from "@/lib/user-auth";
import { cookies } from "next/headers";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    if ((await cookies()).get(cookieName)?.value) return NextResponse.json({ authenticated: false }, { status: 401 });
    return NextResponse.json({ authenticated: false });
  }
  return NextResponse.json({ authenticated: true, name: user.name, email: user.normalizedEmail });
}
