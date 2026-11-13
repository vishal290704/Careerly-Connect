import { Suspense } from "react";
import { ResetForm } from "./reset-form";

export default function ResetPasswordPage() {
  return <main className="mx-auto max-w-md px-5 py-20"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal">Account recovery</p><h1 className="mt-3 font-newsreader text-5xl tracking-[-0.05em]">Choose a new password.</h1><Suspense fallback={<div className="mt-8 h-48 rounded-2xl border bg-surface" />}><ResetForm /></Suspense></main>;
}
