"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BrandMark } from "./brand-mark";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<{ name: string } | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const isAdminArea = pathname.startsWith("/admin");
  useEffect(() => {
    if (isAdminArea) return;
    fetch("/api/auth/me").then((response) => response.json()).then((result) => {
      if (result.authenticated) setUser({ name: result.name });
    });
  }, [isAdminArea]);
  async function logout() {
    await fetch(isAdminArea ? "/api/admin/logout" : "/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/");
    router.refresh();
  }
  return (
    <header className="border-b bg-canvas/90 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 lg:px-8">
        <BrandMark />
        <nav className="hidden items-center gap-8 text-sm text-muted md:flex">
          {isAdminArea ? <Link className="transition hover:text-ink" href="/admin/dashboard">Admin workspace</Link> : <><Link className="transition hover:text-ink" href="/jobs">Find jobs</Link>{!user && <><Link className="transition hover:text-ink" href="/premium">Premium</Link><Link className="transition hover:text-ink" href="/#how-it-works">How it works</Link></>}</>}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          {isAdminArea ? <button onClick={logout} className="px-3 py-2 text-sm font-medium text-muted hover:text-ink">Sign out</button> : user ? <><Link href="/dashboard" className="px-3 py-2 text-sm font-medium text-muted hover:text-ink">{user.name.split(" ")[0]}</Link><button onClick={logout} className="rounded-full border px-4 py-2 text-sm font-semibold text-muted hover:border-teal hover:text-teal">Sign out</button></> : <><Link href="/login" className="px-3 py-2 text-sm font-medium text-muted hover:text-ink">Log in</Link><Link href="/signup" className="rounded-full bg-teal px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal/90">Create account</Link></>}
        </div>
        <button className="md:hidden" aria-label="Toggle menu" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
      </div>
      {open && <div className="border-t bg-surface px-5 py-5 md:hidden"><div className="flex flex-col gap-5 text-sm"><Link href={isAdminArea ? "/admin/dashboard" : "/jobs"} onClick={() => setOpen(false)}>{isAdminArea ? "Admin workspace" : "Find jobs"}</Link>{!isAdminArea && !user && <><Link href="/premium" onClick={() => setOpen(false)}>Premium</Link><Link href="/#how-it-works" onClick={() => setOpen(false)}>How it works</Link><Link href="/login" onClick={() => setOpen(false)}>Log in</Link><Link href="/signup" className="w-fit rounded-full bg-teal px-5 py-2.5 font-semibold text-white">Create account</Link></>}{!isAdminArea && user && <><Link href="/dashboard" onClick={() => setOpen(false)}>Dashboard</Link><button className="w-fit text-left text-muted" onClick={logout}>Sign out</button></>}</div></div>}
    </header>
  );
}
