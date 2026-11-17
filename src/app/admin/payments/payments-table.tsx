"use client";

import { useEffect, useState } from "react";
import { csrfHeaders } from "@/lib/client-security";
import { LoadingButton, LoadingSpinner } from "@/components/loading-button";
import { Skeleton } from "@/components/skeleton";

type Payment = { _id: string; planId: string; finalAmount: number; transactionId: string; status: string; createdAt: string; userId?: { name?: string; normalizedEmail?: string } };

export function PaymentsTable() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingId, setLoadingId] = useState("");
  useEffect(() => { fetch("/api/admin/payments").then((response) => response.json()).then((result) => setPayments(result.payments ?? [])); }, []);
  async function review(id: string, status: "APPROVED" | "REJECTED") {
    if (loading) return;
    setLoading(true); setLoadingId(id);
    const response = await fetch(`/api/admin/payments/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json", ...(await csrfHeaders()) }, body: JSON.stringify({ status }) });
    const result = await response.json();
    if (!response.ok) setMessage(result.error ?? "Unable to update payment."); else setPayments((current) => current.map((payment) => payment._id === id ? { ...payment, status } : payment));
    setLoading(false); setLoadingId("");
  }
  return <div className="mt-10"><p className="mb-4 text-sm text-muted">{message || "Approve only after checking the payment proof through your private storage workflow."}</p><div className="overflow-x-auto rounded-2xl border bg-surface"><table className="w-full min-w-[700px] text-left text-sm"><thead className="border-b text-muted"><tr><th className="p-4">Applicant</th><th className="p-4">Plan</th><th className="p-4">Transaction</th><th className="p-4">Status</th><th className="p-4">Action</th></tr></thead><tbody>{payments.map((payment) => <tr key={payment._id} className="border-b last:border-0"><td className="p-4"><p className="font-medium">{payment.userId?.name ?? "Unknown"}</p><p className="text-xs text-muted">{payment.userId?.normalizedEmail}</p></td><td className="p-4">{payment.planId} · ₹{payment.finalAmount}</td><td className="p-4">{payment.transactionId}</td><td className="p-4">{payment.status}</td><td className="p-4">{payment.status === "PENDING" && <span className="flex gap-2"><LoadingButton loading={loading && loadingId === payment._id && loading} loadingText={loadingId === payment._id ? "Processing..." : ""} onClick={() => review(payment._id, "APPROVED")} className="rounded-lg bg-teal px-3 py-2 text-xs font-semibold text-white">Approve</LoadingButton><LoadingButton disabled={loading} onClick={() => review(payment._id, "REJECTED")} className="rounded-lg border px-3 py-2 text-xs font-semibold">Reject</LoadingButton></span>}</td></tr>)}</tbody></table>{payments.length === 0 && <p className="p-8 text-center text-muted">No payment submissions yet.</p>}</div></div>;
}
