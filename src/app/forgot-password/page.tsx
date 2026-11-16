"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = new FormData(event.currentTarget).get("email");
    const response = await fetch("/api/auth/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    const result = await response.json();
    setMessage(response.ok ? result.message : "Enter a valid email address.");
  }
  return <main className="mx-auto max-w-md px-5 py-20"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal">Account recovery</p><h1 className="mt-3 font-newsreader text-5xl tracking-[-0.05em]">Reset your password.</h1><p className="mt-4 text-sm leading-6 text-muted">Enter your email and we&apos;ll send a secure reset link if an account exists.</p><form onSubmit={submit} className="mt-8 space-y-4 rounded-2xl border bg-surface p-6"><label className="block text-sm font-medium">Email<input name="email" type="email" required className="mt-2 w-full rounded-xl border bg-transparent px-4 py-3 outline-none focus:border-teal" /></label>{message && <p className="text-sm text-teal">{message}</p>}<button className="w-full rounded-xl bg-teal px-4 py-3 font-semibold text-white">Send reset link</button><Link href="/login" className="block text-center text-sm text-muted">Back to login</Link></form></main>;
}
