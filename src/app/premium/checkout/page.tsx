import Link from "next/link";
import { notFound } from "next/navigation";
import { PaymentForm } from "./payment-form";
import { plans } from "@/lib/plans";

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const { plan: planId } = await searchParams;
  const plan = planId ? plans[planId as keyof typeof plans] : undefined;
  if (!plan || !planId) notFound();
  return <main className="mx-auto max-w-2xl px-5 py-16 lg:px-8"><Link href="/premium" className="text-sm text-teal">← Back to plans</Link><h1 className="mt-6 font-newsreader text-5xl tracking-[-0.05em]">Finish your membership.</h1><p className="mt-4 leading-7 text-muted">Pay securely with Razorpay using cards, UPI, net banking, or supported wallets.</p><div className="mt-9 rounded-2xl border bg-surface p-6"><p className="text-sm font-semibold">Selected plan</p><div className="mt-3 flex items-center justify-between border-b pb-5"><span>Applyora Premium · {plan.name} ({plan.days} days)</span><strong>₹{plan.amount}</strong></div><PaymentForm planId={planId} /></div></main>;
}
