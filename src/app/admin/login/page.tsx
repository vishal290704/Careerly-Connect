"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoadingButton } from "@/components/loading-button";

export default function AdminLoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))) });
    if (response.ok) router.push("/admin/dashboard"); else setError("Invalid administrator credentials.");
    setLoading(false);
  }
  return <main className="mx-auto max-w-md px-5 py-20"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal">Applyora administration</p><h1 className="mt-3 font-newsreader text-5xl tracking-[-0.05em]">Secure sign in.</h1><form action="/api/admin/login" method="post" onSubmit={submit} className="mt-9 space-y-4 rounded-2xl border bg-surface p-6"><label className="block text-sm font-medium">Username<input name="username" required className="mt-2 w-full rounded-xl border bg-transparent px-4 py-3 outline-none focus:border-teal" /></label><label className="block text-sm font-medium">Password<input name="password" type="password" required className="mt-2 w-full rounded-xl border bg-transparent px-4 py-3 outline-none focus:border-teal" /></label>{error && <p className="text-sm text-red-700">{error}</p>}<LoadingButton type="submit" loading={loading} loadingText="Signing in..." className="w-full rounded-xl bg-teal px-4 py-3 font-semibold text-white">Sign in</LoadingButton></form></main>;
}
