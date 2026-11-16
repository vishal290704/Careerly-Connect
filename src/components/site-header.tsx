"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BrandMark } from "./brand-mark";
import { csrfHeaders } from "@/lib/client-security";

type AuthUser = { name: string; email: string };

function broadcastAuthChange() {
  window.dispatchEvent(new Event("applyora-auth-change"));
  localStorage.setItem("applyora-auth-change", String(Date.now()));
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const profileRef = useRef<HTMLDivElement>(null);
  const isAdminArea = pathname.startsWith("/admin");

  useEffect(() => {
    if (isAdminArea) return;
    let active = true;
    async function loadUser() {
      let response = await fetch("/api/auth/me", { cache: "no-store" });
      if (response.status === 401) {
        await fetch("/api/auth/refresh?next=/", { cache: "no-store", redirect: "manual" });
        response = await fetch("/api/auth/me", { cache: "no-store" });
      }
      const result = await response.json();
      if (active) setUser(result.authenticated ? { name: result.name, email: result.email } : null);
    }
    void loadUser();
    const refresh = () => void loadUser();
    window.addEventListener("applyora-auth-change", refresh);
    window.addEventListener("storage", refresh);
    const interval = window.setInterval(refresh, 30000);
    return () => {
      active = false;
      window.removeEventListener("applyora-auth-change", refresh);
      window.removeEventListener("storage", refresh);
      window.clearInterval(interval);
    };
  }, [isAdminArea, pathname]);

  useEffect(() => {
    function close(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) setProfileOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  async function logout() {
    await fetch(isAdminArea ? "/api/admin/logout" : "/api/auth/logout", { method: "POST", headers: await csrfHeaders() });
    setUser(null);
    setProfileOpen(false);
    setOpen(false);
    broadcastAuthChange();
    router.push("/");
    router.refresh();
  }

  const initial = user?.name.trim().charAt(0).toUpperCase() || "?";
  return (
    <header className="relative z-50 border-b bg-canvas/95 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 lg:px-8">
        <BrandMark />
        <nav className="hidden items-center gap-8 text-sm text-muted md:flex">
          {isAdminArea ? <Link className="transition hover:text-ink" href="/admin/dashboard">Admin workspace</Link> : <><Link className="transition hover:text-ink" href="/jobs">Find jobs</Link>{!user && <><Link className="transition hover:text-ink" href="/premium">Premium</Link><Link className="transition hover:text-ink" href="/#how-it-works">How it works</Link></>}</>}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          {isAdminArea ? <button onClick={logout} className="px-3 py-2 text-sm font-medium text-muted hover:text-ink">Sign out</button> : user ? <div ref={profileRef} className="relative"><button aria-label="Open account menu" aria-expanded={profileOpen} onClick={() => setProfileOpen((current) => !current)} className="grid h-10 w-10 place-items-center rounded-full bg-teal font-semibold text-white">{initial}</button>{profileOpen && <div className="absolute right-0 top-[calc(100%+0.75rem)] z-[100] w-64 rounded-xl border bg-surface p-4 shadow-soft"><p className="font-semibold">{user.name}</p><p className="mt-1 truncate text-sm text-muted">{user.email}</p><Link href="/dashboard" onClick={() => setProfileOpen(false)} className="mt-4 block rounded-lg px-3 py-2 text-sm hover:bg-secondary">Dashboard</Link><button onClick={logout} className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm text-red-700 hover:bg-secondary">Log out</button></div>}</div> : <><Link href="/login" className="px-3 py-2 text-sm font-medium text-muted hover:text-ink">Log in</Link><Link href="/signup" className="rounded-full bg-teal px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal/90">Create account</Link></>}
        </div>
        <button className="md:hidden" aria-label="Toggle menu" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
      </div>
      {open && <div className="relative z-50 border-t bg-surface px-5 py-5 shadow-sm md:hidden"><div className="flex flex-col gap-5 text-sm"><Link href={isAdminArea ? "/admin/dashboard" : "/jobs"} onClick={() => setOpen(false)}>{isAdminArea ? "Admin workspace" : "Find jobs"}</Link>{!isAdminArea && !user && <><Link href="/premium" onClick={() => setOpen(false)}>Premium</Link><Link href="/#how-it-works" onClick={() => setOpen(false)}>How it works</Link><Link href="/login" onClick={() => setOpen(false)}>Log in</Link><Link href="/signup" className="w-fit rounded-full bg-teal px-5 py-2.5 font-semibold text-white">Create account</Link></>}{!isAdminArea && user && <><Link href="/dashboard" onClick={() => setOpen(false)}>Dashboard</Link><p className="text-sm text-muted">{user.email}</p><button className="w-fit text-left text-muted" onClick={logout}>Log out</button></>}</div></div>}
    </header>
  );
}
