"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function RouteProgress() {
  const pathname = usePathname();
  const [startedHref, setStartedHref] = useState<string | null>(null);

  useEffect(() => {
    const start = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const link = target.closest("a");
      if (link && link.href && link.target !== "_blank") {
        const url = new URL(link.href);
        if (url.origin === window.location.origin) setStartedHref(link.href);
      }
    };
    document.addEventListener("click", start, true);
    return () => document.removeEventListener("click", start, true);
  }, []);

  let active = false;
  if (startedHref) {
    try {
      active = new URL(startedHref).pathname !== pathname;
    } catch {
      active = false;
    }
  }

  return active ? <div aria-hidden="true" className="fixed inset-x-0 top-0 z-[300] h-[3px] bg-teal/20"><div className="h-full origin-left bg-teal motion-safe:animate-[routeProgress_1s_ease-in-out_infinite]" /></div> : null;
}
