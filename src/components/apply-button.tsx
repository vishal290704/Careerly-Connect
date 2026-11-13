"use client";

import { useState } from "react";

export function ApplyButton({ jobId, disabled = false }: { jobId: string; disabled?: boolean }) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  async function apply() {
    const applicationWindow = window.open("about:blank", "_blank");
    if (applicationWindow) applicationWindow.opener = null;
    setLoading(true); setMessage("");
    const response = await fetch("/api/applications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jobId }) });
    const result = await response.json();
    if (!response.ok) { applicationWindow?.close(); setMessage(result.error ?? "Unable to apply."); } else {
      setMessage("Application recorded. Opening employer site...");
      if (applicationWindow) applicationWindow.location.href = result.applyUrl;
      else window.open(result.applyUrl, "_blank", "noopener,noreferrer");
    }
    setLoading(false);
  }
  return <div><button type="button" disabled={disabled || loading} onClick={apply} className="rounded-xl bg-teal px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">{loading ? "Recording..." : disabled ? "Applied" : "Apply now"}</button>{message && <p className="mt-2 max-w-xs text-right text-xs text-muted">{message}</p>}</div>;
}
