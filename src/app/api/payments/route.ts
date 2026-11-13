import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { getCurrentUser } from "@/lib/user-auth";
import { getRazorpayOrder, verifyRazorpaySignature } from "@/lib/razorpay";
import { Payment } from "@/models/Payment";
import { plans } from "@/lib/plans";
import { User } from "@/models/User";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in before completing payment." }, { status: 401 });
  const parsed = z.object({
    planId: z.enum(["1-month", "3-months", "6-months"]),
    referralCode: z.string().trim().min(4).max(32).optional(),
    razorpay_order_id: z.string().min(10),
    razorpay_payment_id: z.string().min(10),
    razorpay_signature: z.string().min(10),
  }).safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid Razorpay payment response." }, { status: 400 });
  const { planId, razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = parsed.data;
  try {
    if (!verifyRazorpaySignature(orderId, paymentId, signature)) return NextResponse.json({ error: "Payment signature verification failed." }, { status: 400 });
    const order = await getRazorpayOrder(orderId);
    await connectToDatabase();
    const referralCode = parsed.data.referralCode?.toUpperCase();
    let referrer = null;
    if (referralCode) {
      referrer = await User.findOne({ referralCode, _id: { $ne: user._id } });
      if (!referrer) return NextResponse.json({ error: "That referral code is invalid." }, { status: 400 });
      if (user.referredBy) return NextResponse.json({ error: "Referral attribution has already been used on this account." }, { status: 409 });
    }
    const plan = plans[planId];
    const finalAmount = referrer ? plan.referralAmount : plan.amount;
    if (order.currency !== "INR" || order.amount !== finalAmount * 100) return NextResponse.json({ error: "Payment amount does not match the selected plan." }, { status: 400 });
    const duplicate = await Payment.exists({ $or: [{ razorpayOrderId: orderId }, { razorpayPaymentId: paymentId }] });
    if (duplicate) return NextResponse.json({ error: "This payment has already been submitted." }, { status: 409 });
    await Payment.create({ userId: user._id, planId, originalAmount: plan.amount, discountAmount: plan.amount - finalAmount, finalAmount, transactionId: paymentId, paymentMethod: "RAZORPAY", razorpayOrderId: orderId, razorpayPaymentId: paymentId, razorpaySignature: signature, referralCodeUsed: referralCode });
    if (referrer) { user.referredBy = referrer._id; await user.save(); }
    return NextResponse.json({ message: "Payment received and submitted for Applyora review." }, { status: 201 });
  } catch (error) {
    console.error("Razorpay payment verification failed", error);
    return NextResponse.json({ error: "Unable to verify this payment. Please contact support if money was deducted." }, { status: 502 });
  }
}
