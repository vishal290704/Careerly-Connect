import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { isAdmin } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/db";
import { Payment } from "@/models/Payment";
import { User } from "@/models/User";
import { ensureReferralCode, processReferralReward } from "@/lib/referrals";
import { hasValidCsrfToken } from "@/lib/security";

const durations = { "1-month": 30, "3-months": 90, "6-months": 180 } as const;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await hasValidCsrfToken(request))) return NextResponse.json({ error: "Invalid request." }, { status: 403 });
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: "Invalid payment." }, { status: 400 });
  const { status, rejectionReason } = await request.json() as { status?: "APPROVED" | "REJECTED"; rejectionReason?: string };
  if (!status || !["APPROVED", "REJECTED"].includes(status)) return NextResponse.json({ error: "Invalid payment status." }, { status: 400 });
  await connectToDatabase();
  const session = await mongoose.startSession();
  try {
    let updatedPayment;
    await session.withTransaction(async () => {
      const payment = await Payment.findOneAndUpdate(
        { _id: id, status: "PENDING" },
        { $set: { status, rejectionReason: status === "REJECTED" ? rejectionReason?.trim() : undefined, reviewedAt: new Date() } },
        { new: true, session },
      );
      if (!payment) throw new Error("PAYMENT_ALREADY_REVIEWED");
      updatedPayment = payment;
      if (status === "APPROVED") {
        const user = await User.findById(payment.userId).session(session);
        if (!user) throw new Error("USER_NOT_FOUND");
        const days = durations[payment.planId as keyof typeof durations];
        const start = user.premiumExpiresAt && user.premiumExpiresAt > new Date() ? user.premiumExpiresAt : new Date();
        user.premiumExpiresAt = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
        await user.save({ session });
        await ensureReferralCode(user, session);
        await processReferralReward(user._id, payment._id, session);
      }
    });
    return NextResponse.json({ payment: updatedPayment });
  } catch (error) {
    if (error instanceof Error && error.message === "PAYMENT_ALREADY_REVIEWED") return NextResponse.json({ error: "Payment has already been reviewed." }, { status: 409 });
    console.error("payment review failed", error);
    return NextResponse.json({ error: "Unable to update payment." }, { status: 500 });
  } finally {
    await session.endSession();
  }
}
