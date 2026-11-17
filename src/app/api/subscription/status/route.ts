import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/user-auth";
import { getPremiumStatus } from "@/lib/premium";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ authenticated: false, active: false }, { status: 401 });
  const status = await getPremiumStatus(user);
  return NextResponse.json({ authenticated: true, active: status.active, expiresAt: status.expiresAt, remainingDays: status.remainingDays });
}
