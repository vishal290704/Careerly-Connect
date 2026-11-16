import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createCsrfToken } from "@/lib/security";

export async function GET() {
  const existing = (await cookies()).get("applyora_csrf")?.value;
  if (existing) return NextResponse.json({ csrfToken: existing });
  const response = NextResponse.json({ csrfToken: await createCsrfToken() });
  return response;
}
