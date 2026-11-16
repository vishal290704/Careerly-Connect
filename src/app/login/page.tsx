"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true); setError("");
    const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))) });
    const result = await response.json();
    if (!response.ok) setError(result.error ?? "Unable to log in."); else { window.dispatchEvent(new Event("applyora-auth-change")); localStorage.setItem("applyora-auth-change", String(Date.now())); router.push("/dashboard"); }
    setLoading(false);
  }
  return <main className="mx-auto max-w-md px-5 py-20"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal">Welcome back</p><h1 className="mt-3 font-newsreader text-5xl tracking-[-0.05em]">Pick up where you left off.</h1><form action="/api/auth/login" method="post" onSubmit={submit} className="mt-9 space-y-4 rounded-2xl border bg-surface p-6"><label className="block text-sm font-medium">Email<input name="email" type="email" required className="mt-2 w-full rounded-xl border bg-transparent px-4 py-3 outline-none focus:border-teal" /></label><label className="block text-sm font-medium">Password<input name="password" type="password" required className="mt-2 w-full rounded-xl border bg-transparent px-4 py-3 outline-none focus:border-teal" /></label><div className="text-right"><Link href="/forgot-password" className="text-sm font-medium text-teal">Forgot password?</Link></div>{error && <p className="text-sm text-red-700">{error}</p>}<button disabled={loading} className="w-full rounded-xl bg-teal px-4 py-3 font-semibold text-white disabled:opacity-60">{loading ? "Logging in..." : "Log in"}</button><p className="text-center text-sm text-muted">New to Applyora? <Link href="/signup" className="font-semibold text-teal">Create an account</Link></p></form></main>;
}
