"use client";

import { useEffect } from "react";

/**
 * When a page is opened with ?focus=…, scrolls the matching element into view
 * and flashes a ring around it. Elements opt in with data-focus="<key>".
 * Returns nothing; the caller can also read `focus` to open things (a modal,
 * a file picker) as part of the same jump.
 */
export function useFocusTarget(focus: string | undefined, ready = true) {
  useEffect(() => {
    if (!focus || !ready) return;
    const timer = setTimeout(() => {
      const el = document.querySelector<HTMLElement>(`[data-focus="${CSS.escape(focus)}"]`);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.remove("focus-flash");
      void el.offsetWidth; // restart the animation if it already ran
      el.classList.add("focus-flash");
    }, 250);
    return () => clearTimeout(timer);
  }, [focus, ready]);
}
