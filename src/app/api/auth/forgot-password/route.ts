import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { hasValidOrigin, isRateLimited } from "@/lib/security";

export async function POST(request: Request) {
  if (!hasValidOrigin(request)) return NextResponse.json({ error: "Invalid request." }, { status: 403 });
  if (isRateLimited(request, "forgot-password", 5)) return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  const { email } = z.object({ email: z.string().email() }).parse(await request.json());
  await connectToDatabase();
  const user = await User.findOne({ normalizedEmail: email.toLowerCase() });
  if (user) {
    const token = randomBytes(32).toString("hex");
    user.passwordResetTokenHash = createHash("sha256").update(token).digest("hex");
    user.passwordResetExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();
    console.info("Password reset requested. Configure email delivery to send the reset link.");
  }
  return NextResponse.json({
    message: "If an account exists for that email, reset instructions have been sent.",
  });
}
