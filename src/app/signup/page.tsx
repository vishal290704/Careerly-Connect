"use client";

import Link from "next/link";
import { useState } from "react";
import { LoadingButton } from "@/components/loading-button";

const fields = [
  ["name", "Full name", "text"], ["email", "Email", "email"], ["college", "College / university", "text"],
  ["password", "Password", "password"], ["phone", "Phone number", "tel"], ["year", "Academic year / batch", "text"],
  ["branch", "Branch", "text"], ["location", "Location", "text"],
] as const;

export default function SignupPage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError(""); setMessage("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const response = await fetch("/api/auth/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(form)) });
    const result = await response.json();
    if (!response.ok) setError(result.error ?? "Unable to create account.");
    else { setMessage(result.message); formElement.reset(); }
    setLoading(false);
  }
  return <main className="mx-auto max-w-2xl px-5 py-16"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal">Start here</p><h1 className="mt-3 font-newsreader text-5xl tracking-[-0.05em]">Make your next move count.</h1><form action="/api/auth/signup" method="post" onSubmit={submit} className="mt-9 grid gap-4 rounded-2xl border bg-surface p-6 sm:grid-cols-2">{fields.map(([name, label, type]) => <label key={name} className="block text-sm font-medium">{label}<input name={name} type={type} required className="mt-2 w-full rounded-xl border bg-transparent px-4 py-3 outline-none focus:border-teal" /></label>)}<div className="sm:col-span-2">{error && <p className="mb-3 text-sm text-red-700">{error}</p>}{message && <p className="mb-3 text-sm text-teal">{message}</p>}<LoadingButton type="submit" loading={loading} loadingText="Creating account..." className="w-full rounded-xl bg-teal px-4 py-3 font-semibold text-white">Create account</LoadingButton></div><p className="text-center text-sm text-muted sm:col-span-2">Already have an account? <Link href="/login" className="font-semibold text-teal">Log in</Link></p></form></main>;
}
