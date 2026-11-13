import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { getCurrentUser } from "@/lib/user-auth";
import { createRazorpayOrder, getRazorpayKeyId } from "@/lib/razorpay";
import { plans } from "@/lib/plans";
import { User } from "@/models/User";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in before starting payment." }, { status: 401 });
  const parsed = z.object({
    planId: z.enum(["1-month", "3-months", "6-months"]),
    referralCode: z.string().trim().min(4).max(32).optional(),
  }).safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Please select a valid plan." }, { status: 400 });

  await connectToDatabase();
  const referralCode = parsed.data.referralCode?.toUpperCase();
  let hasReferral = false;
  if (referralCode) {
    const referrer = await User.findOne({ referralCode, _id: { $ne: user._id } });
    if (!referrer) return NextResponse.json({ error: "That referral code is invalid." }, { status: 400 });
    if (user.referredBy) return NextResponse.json({ error: "Referral attribution has already been used on this account." }, { status: 409 });
    hasReferral = true;
  }

  const plan = plans[parsed.data.planId];
  const amount = hasReferral ? plan.referralAmount : plan.amount;
  try {
    const order = await createRazorpayOrder(amount, `applyora_${user._id}_${Date.now()}`);
    return NextResponse.json({ keyId: getRazorpayKeyId(), orderId: order.id, amount: order.amount, currency: order.currency, planId: parsed.data.planId, amountInRupees: amount });
  } catch (error) {
    console.error("Razorpay order creation failed", error);
    return NextResponse.json({ error: "Unable to start Razorpay checkout. Please try again." }, { status: 502 });
  }
}
