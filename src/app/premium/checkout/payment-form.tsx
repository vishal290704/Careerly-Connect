"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { csrfHeaders } from "@/lib/client-security";
import { LoadingButton } from "@/components/loading-button";

export function PaymentForm({ planId, redirect }: { planId: string; redirect?: string }) {
  void redirect;
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setLoading(true);
    setError("");
    setMessage("");
    const data = new FormData(form);
    data.set("planId", planId);
    try {
      const response = await fetch("/api/payments", { method: "POST", headers: await csrfHeaders(), body: data });
      const result = await response.json();
      if (!response.ok) setError(result.error ?? "Unable to submit payment.");
      else {
        setMessage(result.message);
        form.reset();
        router.push("/dashboard");
      }
    } catch {
      setError("Unable to submit payment. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return <form onSubmit={submit} className="mt-6 space-y-4"><label className="block text-sm font-medium">UPI ID<input name="upiId" required placeholder="name@bank" className="mt-2 w-full rounded-xl border bg-transparent px-4 py-3 outline-none focus:border-teal" /></label><label className="block text-sm font-medium">Transaction ID / UTR<input name="transactionId" required className="mt-2 w-full rounded-xl border bg-transparent px-4 py-3 outline-none focus:border-teal" /></label><label className="block text-sm font-medium">Referral code (optional)<input name="referralCode" placeholder="AYUREF7K2Q" className="mt-2 w-full rounded-xl border bg-transparent px-4 py-3 outline-none focus:border-teal" /></label><label className="block text-sm font-medium">Payment screenshot<input name="paymentProof" type="file" accept="image/png,image/jpeg,image/webp" required className="mt-2 block w-full rounded-xl border bg-transparent px-4 py-3 text-sm" /></label>{error && <p className="text-sm text-red-700">{error}</p>}{message && <p className="text-sm text-teal">{message}</p>}<LoadingButton type="submit" loading={loading} loadingText="Verifying payment..." className="w-full rounded-xl bg-teal px-4 py-3 font-semibold text-white">Submit payment for verification</LoadingButton></form>;
}
