"use client";

import { useState } from "react";
import { csrfHeaders } from "@/lib/client-security";

type Props = {
  name: string;
  phone: string;
  college: string;
  academicYear: string;
  branch: string;
  location: string;
};

export function ProfileEditor(props: Props) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const body = Object.fromEntries(new FormData(event.currentTarget).entries());
    const response = await fetch("/api/auth/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...(await csrfHeaders()) },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    setMessage(response.ok ? "Profile updated." : result.error ?? "Unable to update profile.");
    setLoading(false);
  }

  return (
    <div className="mt-4">
      <button type="button" onClick={() => setOpen((current) => !current)} className="text-sm font-semibold text-teal">{open ? "Cancel" : "Edit profile"}</button>
      {open && <form onSubmit={submit} className="mt-4 space-y-3">
        <label className="block text-xs text-muted">Full name<input name="name" defaultValue={props.name} required className="mt-1 w-full rounded-lg border bg-transparent px-3 py-2 text-sm text-ink" /></label>
        <label className="block text-xs text-muted">Phone<input name="phone" defaultValue={props.phone} className="mt-1 w-full rounded-lg border bg-transparent px-3 py-2 text-sm text-ink" /></label>
        <label className="block text-xs text-muted">College<input name="college" defaultValue={props.college} className="mt-1 w-full rounded-lg border bg-transparent px-3 py-2 text-sm text-ink" /></label>
        <label className="block text-xs text-muted">Academic year<input name="academicYear" defaultValue={props.academicYear} className="mt-1 w-full rounded-lg border bg-transparent px-3 py-2 text-sm text-ink" /></label>
        <label className="block text-xs text-muted">Branch<input name="branch" defaultValue={props.branch} className="mt-1 w-full rounded-lg border bg-transparent px-3 py-2 text-sm text-ink" /></label>
        <label className="block text-xs text-muted">Location<input name="location" defaultValue={props.location} className="mt-1 w-full rounded-lg border bg-transparent px-3 py-2 text-sm text-ink" /></label>
        {message && <p className="text-xs text-muted" role="status">{message}</p>}
        <button disabled={loading} className="rounded-lg bg-teal px-4 py-2 text-xs font-semibold text-white disabled:opacity-60">{loading ? "Saving..." : "Save changes"}</button>
      </form>}
    </div>
  );
}
