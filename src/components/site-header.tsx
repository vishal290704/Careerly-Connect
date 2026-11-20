"use client";

import Link from "next/link";
import {
  Bookmark,
  BriefcaseBusiness,
  Crown,
  FileText,
  Menu,
  UserRound,
  Users,
  X,
} from "lucide-react";
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
  const [openRoute, setOpenRoute] = useState<string | null>(null);
  const [profileRoute, setProfileRoute] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userStatus, setUserStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");
  const [adminStatus, setAdminStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");
  const pathname = usePathname();
  const router = useRouter();
  const profileRef = useRef<HTMLDivElement>(null);
  const isAdminArea = pathname.startsWith("/admin");

  useEffect(() => {
    if (isAdminArea) {
      let active = true;
      let requestSequence = 0;
      fetch("/api/admin/session", { cache: "no-store" })
        .then(async (response) => response.ok ? response.json() : { authenticated: false })
        .then((result) => {
          if (active) setAdminStatus(result.authenticated ? "authenticated" : "unauthenticated");
        })
        .catch(() => {
          if (active) setAdminStatus("unauthenticated");
        });
      const refresh = () => {
        const sequence = ++requestSequence;
        fetch("/api/admin/session", { cache: "no-store" })
          .then(async (response) => response.ok ? response.json() : { authenticated: false })
          .then((result) => {
            if (active && sequence === requestSequence) setAdminStatus(result.authenticated ? "authenticated" : "unauthenticated");
          })
          .catch(() => {
            if (active && sequence === requestSequence) setAdminStatus("unauthenticated");
          });
      };
      window.addEventListener("applyora-admin-auth-change", refresh);
      return () => {
        active = false;
        window.removeEventListener("applyora-admin-auth-change", refresh);
      };
    }
    let active = true;

    async function loadUser() {
      try {
        let response = await fetch("/api/auth/me", { cache: "no-store" });
        if (response.status === 401) {
          await fetch("/api/auth/refresh?next=/", { cache: "no-store", redirect: "manual" });
          response = await fetch("/api/auth/me", { cache: "no-store" });
        }
        const result = await response.json();
        if (active) {
          if (result.authenticated) {
            setUser({ name: result.name, email: result.email });
            setUserStatus("authenticated");
          } else {
            setUser(null);
            setUserStatus("unauthenticated");
          }
        }
      } catch {
        if (active) {
          setUser(null);
          setUserStatus("unauthenticated");
        }
      }
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
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) setProfileRoute(null);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  async function logout() {
    await fetch(isAdminArea ? "/api/admin/logout" : "/api/auth/logout", {
      method: "POST",
      headers: await csrfHeaders(),
    });
    setUser(null);
    setUserStatus("unauthenticated");
    setAdminStatus("unauthenticated");
    setProfileRoute(null);
    setOpenRoute(null);
    broadcastAuthChange();
    if (isAdminArea) window.dispatchEvent(new Event("applyora-admin-auth-change"));
    router.push("/");
    router.refresh();
  }

  const open = openRoute === pathname;
  const profileOpen = profileRoute === pathname;
  const initial = user?.name.trim().charAt(0).toUpperCase() || "?";
  const showAdminNavigation = isAdminArea && pathname !== "/admin/login" && adminStatus === "authenticated";
  const navLinkClass = (href: string) =>
    `relative py-2 text-sm transition after:absolute after:inset-x-0 after:-bottom-1 after:h-0.5 after:origin-left after:rounded-full after:bg-teal after:transition-transform ${
      pathname === href || (href !== "/" && pathname.startsWith(href))
        ? "text-ink after:scale-x-100"
        : "text-muted after:scale-x-0 hover:text-ink hover:after:scale-x-100"
    }`;

  const publicLinks = (
    <>
      <Link className={navLinkClass("/jobs")} href="/jobs">Find jobs</Link>
      <Link className={navLinkClass("/premium")} href="/premium">Premium</Link>
      <Link className={navLinkClass("/#how-it-works")} href="/#how-it-works">How it works</Link>
    </>
  );

  const adminLinks = (
    <>
      <Link className={navLinkClass("/admin/dashboard")} href="/admin/dashboard">Overview</Link>
      <Link className={navLinkClass("/admin/jobs")} href="/admin/jobs">Jobs</Link>
      <Link className={navLinkClass("/admin/applications")} href="/admin/applications">Applications</Link>
      <Link className={navLinkClass("/admin/payments")} href="/admin/payments">Payments</Link>
      <Link className={navLinkClass("/admin/users")} href="/admin/users">Users</Link>
    </>
  );

  return (
    <header className="sticky top-0 z-50 border-b bg-canvas/95 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center px-5 lg:px-8">
        <BrandMark />

        <nav aria-label="Primary navigation" className="hidden items-center gap-7 text-sm md:flex md:ml-10 lg:ml-14">
          {showAdminNavigation ? adminLinks : isAdminArea ? null : publicLinks}
        </nav>

        <div className="ml-auto hidden items-center gap-3 md:flex">
          {showAdminNavigation ? (
            <button
              onClick={logout}
              className="rounded-full border px-4 py-2.5 text-sm font-semibold text-muted transition hover:border-teal hover:text-ink"
            >
              Sign out
            </button>
          ) : userStatus === "authenticated" && user ? (
            <div ref={profileRef} className="relative">
              <button
                aria-label="Open profile menu"
                aria-expanded={profileOpen}
                onClick={() => setProfileRoute((current) => current === pathname ? null : pathname)}
                className="flex h-11 items-center gap-2 rounded-full border bg-surface pl-1 pr-3 shadow-sm transition hover:border-teal"
              >
                <span className="grid h-9 w-9 place-items-center rounded-full bg-teal font-semibold text-white">{initial}</span>
                <span className="max-w-28 truncate text-sm font-semibold">{user.name}</span>
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-[calc(100%+0.75rem)] z-[100] w-72 rounded-2xl border bg-surface p-3 shadow-soft">
                  <div className="border-b px-3 pb-3">
                    <p className="font-semibold">{user.name}</p>
                    <p className="mt-1 truncate text-sm text-muted">{user.email}</p>
                  </div>
                  <div className="mt-2 space-y-1">
                    <Link href="/dashboard" onClick={() => setProfileRoute(null)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-secondary">
                      <UserRound size={16} className="text-teal" /> Profile
                    </Link>
                    <Link href="/dashboard#applications" onClick={() => setProfileRoute(null)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-secondary">
                      <FileText size={16} className="text-teal" /> My applications
                    </Link>
                    <Link href="/dashboard#saved" onClick={() => setProfileRoute(null)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-secondary">
                      <Bookmark size={16} className="text-teal" /> Saved jobs
                    </Link>
                    <Link href="/premium" onClick={() => setProfileRoute(null)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-secondary">
                      <Crown size={16} className="text-teal" /> Subscription
                    </Link>
                    <button onClick={logout} className="mt-1 w-full rounded-lg px-3 py-2.5 text-left text-sm text-red-700 hover:bg-secondary">
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className="px-3 py-2 text-sm font-medium text-muted hover:text-ink">Log in</Link>
              <Link href="/signup" className="rounded-full bg-teal px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-teal/90">Create account</Link>
            </>
          )}
        </div>

        <button
          className="ml-auto grid h-10 w-10 place-items-center rounded-full border bg-surface md:hidden"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpenRoute((current) => current === pathname ? null : pathname)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="relative z-50 border-t bg-surface px-5 py-5 shadow-sm md:hidden">
          <nav aria-label="Mobile navigation" className="flex flex-col gap-1 text-sm">
            {showAdminNavigation ? (
              <>
                {[
                  ["/admin/dashboard", "Overview", BriefcaseBusiness],
                  ["/admin/jobs", "Jobs", BriefcaseBusiness],
                  ["/admin/applications", "Applications", FileText],
                  ["/admin/payments", "Payments", Crown],
                  ["/admin/users", "Users", Users],
                ].map(([href, label, Icon]) => (
                  <Link key={String(href)} href={String(href)} onClick={() => setOpenRoute(null)} className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-secondary">
                    <Icon size={17} className="text-teal" /> {String(label)}
                  </Link>
                ))}
                <button onClick={logout} className="mt-2 rounded-lg px-3 py-3 text-left text-red-700 hover:bg-secondary">Sign out</button>
              </>
            ) : (
              <>
                <Link href="/jobs" onClick={() => setOpenRoute(null)} className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-secondary"><BriefcaseBusiness size={17} className="text-teal" /> Find jobs</Link>
                <Link href="/premium" onClick={() => setOpenRoute(null)} className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-secondary"><Crown size={17} className="text-teal" /> Premium</Link>
                <Link href="/#how-it-works" onClick={() => setOpenRoute(null)} className="rounded-lg px-3 py-3 hover:bg-secondary">How it works</Link>
                {userStatus === "authenticated" && user ? (
                  <>
                    <Link href="/dashboard" onClick={() => setOpenRoute(null)} className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-secondary"><UserRound size={17} className="text-teal" /> Profile</Link>
                    <Link href="/dashboard#applications" onClick={() => setOpenRoute(null)} className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-secondary"><FileText size={17} className="text-teal" /> My applications</Link>
                    <Link href="/dashboard#saved" onClick={() => setOpenRoute(null)} className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-secondary"><Bookmark size={17} className="text-teal" /> Saved jobs</Link>
                    <p className="px-3 pt-2 text-xs text-muted">{user.email}</p>
                    <button onClick={logout} className="mt-1 rounded-lg px-3 py-3 text-left text-red-700 hover:bg-secondary">Log out</button>
                  </>
                ) : (
                  <div className="mt-3 grid grid-cols-2 gap-3 border-t pt-4">
                    <Link href="/login" onClick={() => setOpenRoute(null)} className="rounded-xl border px-4 py-3 text-center font-semibold">Log in</Link>
                    <Link href="/signup" onClick={() => setOpenRoute(null)} className="rounded-xl bg-teal px-4 py-3 text-center font-semibold text-white">Create account</Link>
                  </div>
                )}
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
