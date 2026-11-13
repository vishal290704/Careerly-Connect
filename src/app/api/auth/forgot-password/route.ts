import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";

export async function POST(request: Request) {
  const { email } = z.object({ email: z.string().email() }).parse(await request.json());
  await connectToDatabase();
  const user = await User.findOne({ normalizedEmail: email.toLowerCase() });
  let resetUrl: string | undefined;
  if (user) {
    const token = randomBytes(32).toString("hex");
    user.passwordResetTokenHash = createHash("sha256").update(token).digest("hex");
    user.passwordResetExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();
    resetUrl = `${process.env.APP_URL ?? "http://localhost:3000"}/reset-password?token=${token}`;
    console.info(`Password reset requested for ${user.normalizedEmail}. Configure email delivery to send the reset link.`);
  }
  return NextResponse.json({
    message: "If an account exists for that email, reset instructions have been sent.",
    ...(process.env.NODE_ENV !== "production" && resetUrl ? { developmentResetUrl: resetUrl } : {}),
  });
}
