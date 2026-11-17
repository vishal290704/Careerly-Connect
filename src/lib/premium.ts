import type { HydratedDocument } from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { Payment } from "@/models/Payment";
import type { UserDocument } from "@/models/User";

type PremiumUser = HydratedDocument<UserDocument>;

export async function getPremiumStatus(user: PremiumUser, now = new Date()) {
  await connectToDatabase();
  const expiresAt = user.premiumExpiresAt;
  if (!expiresAt || expiresAt <= now) {
    return { active: false, expiresAt: expiresAt ?? null, remainingDays: 0 };
  }

  const approvedPayment = await Payment.findOne({
    userId: user._id,
    status: "APPROVED",
  }).sort({ reviewedAt: -1, updatedAt: -1 }).lean();

  if (!approvedPayment) {
    return { active: false, expiresAt, remainingDays: 0 };
  }

  const approvedExpiration = approvedPayment.subscriptionExpiresAt ?? expiresAt;
  if (approvedExpiration <= now) {
    return { active: false, expiresAt: approvedExpiration, remainingDays: 0 };
  }

  return {
    active: true,
    expiresAt: expiresAt < approvedExpiration ? expiresAt : approvedExpiration,
    remainingDays: Math.max(0, Math.ceil(((expiresAt < approvedExpiration ? expiresAt : approvedExpiration).getTime() - now.getTime()) / 86400000)),
  };
}
