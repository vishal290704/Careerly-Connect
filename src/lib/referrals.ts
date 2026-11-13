import { randomBytes } from "node:crypto";
import type mongoose from "mongoose";
import { Referral } from "@/models/Referral";
import { User } from "@/models/User";

export async function ensureReferralCode(user: { _id: mongoose.Types.ObjectId; name: string }, session: mongoose.ClientSession) {
  if (await User.exists({ _id: user._id, referralCode: { $exists: true, $ne: null } }).session(session)) return;
  const prefix = user.name.replace(/[^a-z]/gi, "").slice(0, 3).toUpperCase().padEnd(3, "X");
  let code = "";
  do {
    code = `${prefix}REF${randomBytes(2).toString("hex").toUpperCase()}`;
  } while (await User.exists({ referralCode: code }).session(session));
  await User.updateOne({ _id: user._id }, { $set: { referralCode: code } }, { session });
}

export async function processReferralReward(userId: mongoose.Types.ObjectId, paymentId: mongoose.Types.ObjectId, session: mongoose.ClientSession) {
  const referredUser = await User.findById(userId).session(session);
  if (!referredUser?.referredBy) return;
  const referral = await Referral.findOne({ referredUserId: userId }).session(session);
  if (referral) return;
  const referrer = await User.findById(referredUser.referredBy).session(session);
  if (!referrer?.referralCode) return;
  await Referral.create([{ referrerUserId: referrer._id, referredUserId: userId, referralCode: referrer.referralCode, qualifyingPaymentId: paymentId }], { session });
  const qualifiedCount = (referrer.successfulReferralCount ?? 0) + 1;
  referrer.successfulReferralCount = qualifiedCount;
  if (qualifiedCount % 2 === 0) {
    const now = new Date();
    const start = referrer.premiumExpiresAt && referrer.premiumExpiresAt > now ? referrer.premiumExpiresAt : now;
    referrer.premiumExpiresAt = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
    referrer.totalRewardDays = (referrer.totalRewardDays ?? 0) + 7;
  }
  await referrer.save({ session });
}
