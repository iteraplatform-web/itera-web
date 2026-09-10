"use client";

import { useEffect, useState } from "react";

/**
 * True once the component has mounted on the client.
 *
 * Persisted state cannot be trusted before this point: during React's
 * hydration pass a store selector still returns the server snapshot, so a
 * persisted value reads as its initial default even though zustand has already
 * rehydrated it. Anything that redirects or renders "not found" based on
 * persisted state has to wait for this first.
 */
export function useHasHydrated(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
