"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";

/* Code that navigates with router.push can start the bar explicitly. */
const listeners = new Set<() => void>();
export function startRouteProgress() {
  listeners.forEach((fn) => fn());
}

/**
 * A thin loading bar along the top of the window during page changes. It
 * starts the moment a link is clicked, creeps forward while the next page
 * loads, and completes when the new URL has rendered — so a slow page never
 * looks like a dead click.
 */
function Bar() {
  const pathname = usePathname();
  const search = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const trickle = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAt = useRef(0);

  const start = () => {
    if (trickle.current) return;
    startedAt.current = performance.now();
    setVisible(true);
    setProgress(12);
    trickle.current = setInterval(() => {
      // Slows as it approaches 90% — it never claims to be done early.
      setProgress((p) => (p < 90 ? p + (90 - p) * 0.12 : p));
    }, 180);
  };

  const finish = () => {
    if (!trickle.current) return;
    clearInterval(trickle.current);
    trickle.current = null;
    // Hold briefly so even an instant navigation registers as feedback.
    const elapsed = performance.now() - startedAt.current;
    setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 260);
    }, Math.max(0, 220 - elapsed));
  };

  useEffect(() => {
    listeners.add(start);
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const a = (e.target as HTMLElement).closest("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const href = a.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      start();
    };
    document.addEventListener("click", onClick, true);
    return () => {
      listeners.delete(start);
      document.removeEventListener("click", onClick, true);
    };
  }, []);

  useEffect(() => {
    finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, search]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[120] h-[3px]"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 250ms" }}
    >
      <div
        className="h-full bg-gradient-to-r from-itera-500 to-itera-600 shadow-[0_0_8px_rgba(47,82,224,0.6)]"
        style={{ width: `${progress}%`, transition: "width 200ms ease-out" }}
      />
    </div>
  );
}

export function RouteProgress() {
  return (
    <Suspense fallback={null}>
      <Bar />
    </Suspense>
  );
}
