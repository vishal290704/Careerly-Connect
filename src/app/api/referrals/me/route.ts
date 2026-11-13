import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/user-auth";
import { connectToDatabase } from "@/lib/db";
import { Referral } from "@/models/Referral";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectToDatabase();
  const referrals = await Referral.find({ referrerUserId: user._id }).select("referredUserId qualifiedAt rewardDays rewardGrantedAt").sort({ qualifiedAt: -1 }).lean();
  return NextResponse.json({ referralCode: user.referralCode ?? null, successfulReferralCount: user.successfulReferralCount ?? 0, totalRewardDays: user.totalRewardDays ?? 0, referrals });
}
