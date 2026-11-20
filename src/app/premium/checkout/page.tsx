import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { PaymentForm } from "./payment-form";
import { plans } from "@/lib/plans";

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ plan?: string; redirect?: string }> }) {
  const { plan: planId, redirect } = await searchParams;
  const plan = planId ? plans[planId as keyof typeof plans] : undefined;
  if (!plan || !planId) notFound();
  return (
    <main className="mx-auto max-w-2xl px-5 py-16 lg:px-8">
      <Link href="/premium" className="text-sm text-teal">
        ← Back to plans
      </Link>
      <h1 className="mt-6 font-newsreader text-5xl tracking-[-0.05em]">
        Finish your membership.
      </h1>
      <p className="mt-4 leading-7 text-muted">
        Scan the QR code with any UPI app, then submit your payment details for
        manual verification.
      </p>
      <section className="mt-8 rounded-2xl border bg-surface p-5 text-center">
        <p className="text-sm font-semibold">Scan to pay with any UPI app</p>
        <Image
          src="/payment-qr.png"
          alt="Applyora payment QR code"
          width={544}
          height={544}
          className="mx-auto mt-5 max-h-[34rem] w-auto max-w-full rounded-xl border object-contain"
        />
        <p className="mt-4 text-xs text-muted">
          Complete the payment for the selected amount, then upload the receipt
          below.
        </p>
      </section>
      <div className="mt-9 rounded-2xl border bg-surface p-6">
        <p className="text-sm font-semibold">Selected plan</p>
        <div className="mt-3 flex items-center justify-between border-b pb-5">
          <span>
            Applyora Premium · {plan.name} ({plan.days} days)
          </span>
          <strong>₹{plan.amount}</strong>
        </div>
        <PaymentForm planId={planId} redirect={redirect} />
      </div>
    </main>
  );
}
