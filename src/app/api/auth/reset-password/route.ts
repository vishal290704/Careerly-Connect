import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import argon2 from "argon2";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { hasValidOrigin, isRateLimited } from "@/lib/security";
import { revokeAllRefreshSessions } from "@/lib/user-auth";

const schema = z.object({ token: z.string().min(32), password: z.string().min(8) });

export async function POST(request: Request) {
  if (!hasValidOrigin(request)) return NextResponse.json({ error: "Invalid request." }, { status: 403 });
  if (isRateLimited(request, "reset-password", 5)) return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  const data = schema.parse(await request.json());
  await connectToDatabase();
  const user = await User.findOne({
    passwordResetTokenHash: createHash("sha256").update(data.token).digest("hex"),
    passwordResetExpiresAt: { $gt: new Date() },
  });
  if (!user) return NextResponse.json({ error: "This reset link is invalid or expired." }, { status: 400 });
  user.passwordHash = await argon2.hash(data.password, { type: argon2.argon2id });
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpiresAt = undefined;
  user.sessionVersion = (user.sessionVersion ?? 0) + 1;
  await user.save();
  await revokeAllRefreshSessions(user.id);
  return NextResponse.json({ message: "Password updated successfully." });
}
