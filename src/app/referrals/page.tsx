import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/user-auth";

export default async function ReferralsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <main className="mx-auto max-w-3xl px-5 py-16 lg:px-8"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal">Referral programme</p><h1 className="mt-3 font-newsreader text-5xl tracking-[-0.05em]">Share a better beginning.</h1><p className="mt-4 leading-7 text-muted">Your referral code becomes available after your first Premium payment is approved.</p><section className="mt-10 rounded-2xl border bg-surface p-6"><p className="text-sm text-muted">Your code</p><p className="mt-2 text-2xl font-semibold tracking-wider">{user.referralCode ?? "Available after Premium approval"}</p><div className="mt-8 grid gap-4 sm:grid-cols-2"><div><p className="text-sm text-muted">Successful referrals</p><p className="mt-1 text-2xl font-semibold">{user.successfulReferralCount ?? 0}</p></div><div><p className="text-sm text-muted">Reward days earned</p><p className="mt-1 text-2xl font-semibold">{user.totalRewardDays ?? 0}</p></div></div></section></main>;
}
