"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpay() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function PaymentForm({ planId }: { planId: string }) {
  const [referralCode, setReferralCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function startPayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true); setError(""); setMessage("");
    try {
      const loaded = await loadRazorpay();
      if (!loaded || !window.Razorpay) throw new Error("Razorpay checkout could not be loaded.");
      const orderResponse = await fetch("/api/payments/order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ planId, referralCode: referralCode.trim() || undefined }) });
      const order = await orderResponse.json();
      if (!orderResponse.ok) throw new Error(order.error ?? "Unable to start payment.");
      const Razorpay = window.Razorpay;
      const checkout = new Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Applyora",
        description: `Premium · ${planId}`,
        order_id: order.orderId,
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          const verifyResponse = await fetch("/api/payments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ planId, referralCode: referralCode.trim() || undefined, ...response }) });
          const result = await verifyResponse.json();
          if (!verifyResponse.ok) { setError(result.error ?? "Payment verification failed."); return; }
          setMessage(result.message); setTimeout(() => router.push("/dashboard"), 900);
        },
        prefill: { name: "", email: "" },
        theme: { color: "#286B68" },
      });
      checkout.open();
    } catch (paymentError) {
      setError(paymentError instanceof Error ? paymentError.message : "Unable to start payment.");
    } finally {
      setLoading(false);
    }
  }

  return <form onSubmit={startPayment} className="mt-6 space-y-4"><label className="block text-sm font-medium">Referral code (optional)<input value={referralCode} onChange={(event) => setReferralCode(event.target.value)} placeholder="AYUREF7K2Q" className="mt-2 w-full rounded-xl border bg-transparent px-4 py-3 outline-none focus:border-teal" /></label>{error && <p className="text-sm text-red-700">{error}</p>}{message && <p className="text-sm text-teal">{message}</p>}<button disabled={loading} className="w-full rounded-xl bg-teal px-4 py-3 font-semibold text-white disabled:opacity-60">{loading ? "Opening secure checkout..." : "Pay securely with Razorpay"}</button><p className="text-center text-xs text-muted">Your payment is securely processed by Razorpay and will be activated after Applyora review.</p></form>;
}
