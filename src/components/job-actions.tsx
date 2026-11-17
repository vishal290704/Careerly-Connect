"use client";

import { useEffect, useRef, useState } from "react";
import { Bookmark, CheckCircle2, ExternalLink, X } from "lucide-react";
import { csrfHeaders } from "@/lib/client-security";
import { useRouter } from "next/navigation";

type Props = { jobId: string; applyUrl: string; jobTitle: string; companyName: string };

export function JobActions({ jobId, applyUrl, jobTitle, companyName }: Props) {
  const [modalOpen, setModalOpen] = useState(true);
  const [applicationStatus, setApplicationStatus] = useState<"APPLIED" | "WITHDRAWN" | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const closeRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  useEffect(() => {
    setModalOpen(true);
    fetch(`/api/applications?jobId=${jobId}`, { cache: "no-store" })
      .then(async (response) => response.ok ? response.json() : null)
      .then((result) => setApplicationStatus(result?.application?.status ?? null))
      .catch(() => {});
    fetch("/api/saved-jobs", { cache: "no-store" })
      .then(async (response) => response.ok ? response.json() : null)
      .then((result) => setSaved((result?.jobs ?? []).some((item: { id: string }) => item.id === jobId)))
      .catch(() => {});
  }, [jobId]);

  useEffect(() => {
    if (!modalOpen) return;
    closeRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setModalOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [modalOpen]);

  async function markApplied() {
    setLoading(true);
    setMessage("");
    const response = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await csrfHeaders()) },
      body: JSON.stringify({ jobId }),
    });
    const result = await response.json();
    if (response.status === 401) router.push("/login");
    else if (!response.ok) setMessage(result.error ?? "Unable to update application.");
    else {
      setApplicationStatus("APPLIED");
      setModalOpen(false);
      setMessage("Application status updated.");
      window.dispatchEvent(new Event("applyora-application-change"));
    }
    setLoading(false);
  }

  async function withdraw() {
    if (!window.confirm("Withdraw this application? It will remain in your application history.")) return;
    setLoading(true);
    const response = await fetch("/api/applications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...(await csrfHeaders()) },
      body: JSON.stringify({ jobId }),
    });
    if (response.ok) {
      setApplicationStatus("WITHDRAWN");
      setMessage("Application withdrawn.");
      window.dispatchEvent(new Event("applyora-application-change"));
    }
    setLoading(false);
  }

  async function toggleSaved() {
    setLoading(true);
    const response = await fetch("/api/saved-jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await csrfHeaders()) },
      body: JSON.stringify({ jobId }),
    });
    if (response.status === 401) router.push("/login");
    else if (response.ok) {
      const result = await response.json();
      setSaved(Boolean(result.saved));
      window.dispatchEvent(new Event("applyora-saved-change"));
    }
    setLoading(false);
  }

  function applyNow() {
    window.open(applyUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={applyNow} className="inline-flex items-center gap-2 rounded-xl bg-teal px-5 py-3 text-sm font-semibold text-white">Apply now <ExternalLink size={15} /></button>
        {applicationStatus === "APPLIED" ? (
          <button type="button" disabled={loading} onClick={withdraw} className="rounded-xl border px-5 py-3 text-sm font-semibold hover:border-red-700 hover:text-red-700">Withdraw application</button>
        ) : applicationStatus === "WITHDRAWN" ? (
          <button type="button" disabled={loading} onClick={markApplied} className="rounded-xl border border-teal px-5 py-3 text-sm font-semibold text-teal">Apply again</button>
        ) : (
          <button type="button" disabled={loading} onClick={markApplied} className="rounded-xl border px-5 py-3 text-sm font-semibold">Mark as applied</button>
        )}
        <button type="button" disabled={loading} aria-pressed={saved} onClick={toggleSaved} className={`inline-flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold ${saved ? "border-teal text-teal" : ""}`}>
          <Bookmark size={16} fill={saved ? "currentColor" : "none"} /> {saved ? "Saved" : "Save"}
        </button>
      </div>
      {applicationStatus && <p className="mt-3 text-xs font-semibold text-muted">{applicationStatus === "APPLIED" ? <span className="inline-flex items-center gap-1 text-teal"><CheckCircle2 size={14} /> Applied</span> : "Withdrawn"}</p>}
      {message && <p className="mt-2 text-xs text-muted" role="status">{message}</p>}

      {modalOpen && (
        <div className="fixed inset-0 z-[200] grid place-items-center bg-black/55 px-5" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="application-modal-title" className="w-full max-w-md animate-[fadeIn_.18s_ease-out] rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal">Application check-in</p>
                <h2 id="application-modal-title" className="mt-2 font-newsreader text-3xl">Have you applied?</h2>
              </div>
              <button ref={closeRef} type="button" aria-label="Close" onClick={() => setModalOpen(false)} className="rounded-full p-2 text-muted hover:bg-secondary"><X size={18} /></button>
            </div>
            <p className="mt-5 leading-7 text-muted">You opened the application page for <strong className="text-ink">{jobTitle}</strong> at <strong className="text-ink">{companyName}</strong>. Did you submit your application?</p>
            {applicationStatus && <p className="mt-3 text-sm font-semibold text-teal">Current status: {applicationStatus}</p>}
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <button type="button" disabled={loading} onClick={markApplied} className="rounded-xl bg-teal px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">Yes, I applied</button>
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl border px-4 py-3 text-sm font-semibold">Not yet</button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
