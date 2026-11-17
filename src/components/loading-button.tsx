"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

export function LoadingSpinner({ size = 16, className = "" }: { size?: number; className?: string }) {
  return <span aria-hidden="true" className={`inline-block shrink-0 rounded-full border-2 border-current border-r-transparent motion-safe:animate-spin ${className}`} style={{ width: size, height: size }} />;
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  loadingText?: ReactNode;
  children: ReactNode;
};

export function LoadingButton({ loading = false, loadingText, children, disabled, className = "", type = "button", ...props }: Props) {
  return (
    <button type={type} disabled={disabled || loading} aria-busy={loading} className={`inline-flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60 ${className}`} {...props}>
      {loading && <LoadingSpinner />}
      <span>{loading ? loadingText ?? "Loading..." : children}</span>
    </button>
  );
}
