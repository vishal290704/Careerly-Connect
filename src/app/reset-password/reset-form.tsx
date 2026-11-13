"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

export function ResetForm() {
  const params = useSearchParams();
  const [message, setMessage] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const password = new FormData(event.currentTarget).get("password");
    const response = await fetch("/api/auth/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: params.get("token"), password }) });
    const result = await response.json();
    setMessage(result.message ?? result.error);
  }
  return <form onSubmit={submit} className="mt-8 space-y-4 rounded-2xl border bg-surface p-6"><label className="block text-sm font-medium">New password<input name="password" type="password" minLength={8} required className="mt-2 w-full rounded-xl border bg-transparent px-4 py-3 outline-none focus:border-teal" /></label>{message && <p className="text-sm text-teal">{message}</p>}<button className="w-full rounded-xl bg-teal px-4 py-3 font-semibold text-white">Update password</button></form>;
}
