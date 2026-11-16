import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { getCurrentUser } from "@/lib/user-auth";
import { Payment } from "@/models/Payment";
import { plans } from "@/lib/plans";
import { User } from "@/models/User";
import { hasValidCsrfToken } from "@/lib/security";

export async function POST(request: Request) {
  if (!(await hasValidCsrfToken(request))) return NextResponse.json({ error: "Invalid request." }, { status: 403 });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in before submitting payment." }, { status: 401 });
  const form = await request.formData();
  const parsed = z.object({
    planId: z.enum(["1-month", "3-months", "6-months"]),
    upiId: z.string().trim().min(3).max(120),
    transactionId: z.string().trim().min(4).max(120),
    referralCode: z.string().trim().min(4).max(32).optional(),
  }).safeParse({
    planId: form.get("planId"),
    upiId: form.get("upiId"),
    transactionId: form.get("transactionId"),
    referralCode: (form.get("referralCode") || undefined) as string | undefined,
  });
  const proof = form.get("paymentProof");
  if (!parsed.success || !(proof instanceof File)) return NextResponse.json({ error: "Please complete all payment fields." }, { status: 400 });
  if (!["image/jpeg", "image/png", "image/webp"].includes(proof.type) || proof.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Payment proof must be a JPG, PNG, or WebP image under 5 MB." }, { status: 400 });
  await connectToDatabase();
  const referralCode = parsed.data.referralCode?.toUpperCase();
  let referrer = null;
  if (referralCode) {
    referrer = await User.findOne({ referralCode, _id: { $ne: user._id } });
    if (!referrer) return NextResponse.json({ error: "That referral code is invalid." }, { status: 400 });
    if (user.referredBy) return NextResponse.json({ error: "Referral attribution has already been used on this account." }, { status: 409 });
  }
  const originalAmount = plans[parsed.data.planId].amount;
  const finalAmount = referrer ? plans[parsed.data.planId].referralAmount : originalAmount;
  if (await Payment.exists({ transactionId: parsed.data.transactionId })) return NextResponse.json({ error: "That transaction ID has already been submitted." }, { status: 409 });
  const bytes = Buffer.from(await proof.arrayBuffer());
  await Payment.create({ userId: user._id, planId: parsed.data.planId, originalAmount, discountAmount: originalAmount - finalAmount, finalAmount, transactionId: parsed.data.transactionId, paymentMethod: "UPI", paymentProofReference: `${user._id.toString()}/${crypto.randomUUID()}`, paymentProof: bytes, paymentProofMimeType: proof.type, upiId: parsed.data.upiId, referralCodeUsed: referralCode });
  if (referrer) { user.referredBy = referrer._id; await user.save(); }
  return NextResponse.json({ message: "Payment submitted for review." }, { status: 201 });
}
