"use client";

import { useEffect, useRef } from "react";
import { useTransactionsStore } from "./transactions-store";
import { useNotificationsStore } from "./notifications-store";
import type { BroadcastEvent } from "./transactions-store";

const TRANSACTIONS_KEY = "itera-transactions-v3";

/**
 * Seeds the stores on first load, then keeps this tab in step with any other
 * tab on the same machine.
 *
 * Zustand's persist middleware does NOT listen for storage events on its own —
 * it only writes. So the agent tab and the client tab would drift apart without
 * this: we listen for the write, then ask persist to rehydrate from what the
 * other tab just saved. That is what makes completing a task on the agent side
 * show up on the client side with no server involved.
 */
export function useStoreHydration() {
  const initTransactions = useTransactionsStore((s) => s.initialize);
  const initNotifications = useNotificationsStore((s) => s.initialize);

  useEffect(() => {
    initTransactions();
    initNotifications();
  }, [initTransactions, initNotifications]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (!e.newValue) return;
      if (e.key === TRANSACTIONS_KEY) void useTransactionsStore.persist.rehydrate();
      // Notifications sync too, so the bell agrees across tabs and an alert one
      // tab has raised is not raised again by the other tab's scheduler.
      if (e.key === "itera-notifications") void useNotificationsStore.persist.rehydrate();
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
}

/**
 * Calls back when another tab reports a change to the given file (or to any
 * file when no id is passed). Used by the client view to surface the live
 * "something just happened" notification.
 */
export function useBroadcastEvents(
  onEvent: (event: BroadcastEvent) => void,
  fileId?: string
) {
  const lastEvent = useTransactionsStore((s) => s.lastEvent);
  const handler = useRef(onEvent);
  handler.current = onEvent;

  /**
   * Whatever was already in storage when this tab opened is old news, so it is
   * captured once on mount and never announced. Note this is seeded on mount
   * rather than from the first event we observe — otherwise a tab that opened
   * with no event at all would swallow the first real one.
   */
  const baseline = useRef<string | null | undefined>(undefined);
  const announced = useRef<string | null>(null);

  useEffect(() => {
    baseline.current = useTransactionsStore.getState().lastEvent?.at ?? null;
  }, []);

  useEffect(() => {
    // Mount effect above has not run yet.
    if (baseline.current === undefined) return;
    if (!lastEvent) return;

    if (lastEvent.at === baseline.current) return;
    if (lastEvent.at === announced.current) return;

    announced.current = lastEvent.at;

    if (fileId && lastEvent.fileId !== fileId) return;
    handler.current(lastEvent);
  }, [lastEvent, fileId]);
}

export { useAuthStore } from "./auth-store";
export { useTransactionsStore } from "./transactions-store";
export { useNotificationsStore } from "./notifications-store";
export type { BroadcastEvent } from "./transactions-store";
