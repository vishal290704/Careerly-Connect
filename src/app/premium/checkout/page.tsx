import Link from "next/link";
import { notFound } from "next/navigation";
import { PaymentForm } from "./payment-form";
import { plans } from "@/lib/plans";

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const { plan: planId } = await searchParams;
  const plan = planId ? plans[planId as keyof typeof plans] : undefined;
  if (!plan || !planId) notFound();
  return <main className="mx-auto max-w-2xl px-5 py-16 lg:px-8"><Link href="/premium" className="text-sm text-teal">← Back to plans</Link><h1 className="mt-6 font-newsreader text-5xl tracking-[-0.05em]">Finish your membership.</h1><p className="mt-4 leading-7 text-muted">Pay using the QR code below, then submit your UPI details and payment proof for manual verification.</p><section className="mt-8 rounded-2xl border bg-surface p-6 text-center"><p className="text-sm font-semibold">Scan to pay with any UPI app</p>{process.env.PAYMENT_QR_IMAGE_URL ? <img src={process.env.PAYMENT_QR_IMAGE_URL} alt="Applyora payment QR code" className="mx-auto mt-5 h-56 w-56 rounded-xl border object-contain p-3" /> : <div className="mx-auto mt-5 grid h-56 w-56 place-items-center rounded-xl border-2 border-dashed bg-secondary p-6 text-sm text-muted">Payment QR will appear here after `PAYMENT_QR_IMAGE_URL` is configured.</div>}<p className="mt-4 text-xs text-muted">Do not upload a screenshot of the QR code as payment proof. Upload your completed payment receipt below.</p></section><div className="mt-9 rounded-2xl border bg-surface p-6"><p className="text-sm font-semibold">Selected plan</p><div className="mt-3 flex items-center justify-between border-b pb-5"><span>Applyora Premium · {plan.name} ({plan.days} days)</span><strong>₹{plan.amount}</strong></div><PaymentForm planId={planId} /></div></main>;
}
