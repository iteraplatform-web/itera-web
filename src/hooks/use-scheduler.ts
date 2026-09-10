"use client";

import { useEffect } from "react";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { useAuthStore, useNotificationsStore, useTransactionsStore } from "@/stores";
import { toast } from "@/stores/toast-store";

const OPEN = new Set(["prospective", "listed", "buyer_agency", "in_progress", "under_contract"]);

/** How often the scheduler looks for things that have come due. */
const TICK_MS = 30_000;

/**
 * The background job that a real deployment runs on the server: every tick it
 * checks every open file for deadlines crossing a threshold and reminders
 * coming due, and raises a notification once for each. Deduplication keys
 * mean the same alert is never raised twice, across refreshes and tabs.
 *
 * Thresholds follow how agents actually work: a heads-up at 3 days, a
 * "due tomorrow" the day before, and an alert once something is overdue.
 */
export function useScheduler() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;

    const run = () => {
      const { files, markReminderFired } = useTransactionsStore.getState();
      const notifications = useNotificationsStore.getState();
      const seen = new Set(notifications.notifications.map((n) => n.dedupeKey).filter(Boolean));
      const now = new Date();

      const raise = (
        key: string,
        data: { fileId: string; title: string; message: string; type: "urgent" | "info" | "success" },
        announce: boolean
      ) => {
        if (seen.has(key)) return;
        seen.add(key);
        notifications.addNotification({ ...data, dedupeKey: key });
        if (announce) {
          data.type === "urgent" ? toast.deadline(data.title, data.message) : toast.info(data.title, data.message);
        }
      };

      let announced = 0;

      for (const file of files) {
        const label = file.propertyAddress || file.clientName;

        /* ── Reminders the agent set ── */
        for (const r of file.reminders ?? []) {
          if (r.done || r.firedAt) continue;
          if (parseISO(r.dueAt) <= now) {
            raise(
              `reminder:${r.id}`,
              {
                fileId: file.id,
                title: `Reminder: ${r.title}`,
                message: `${label}${r.note ? ` — ${r.note}` : ""}`,
                type: "info",
              },
              true
            );
            markReminderFired(file.id, r.id);
          }
        }

        if (!OPEN.has(file.status)) continue;

        /* ── Checklist deadlines ── */
        for (const task of file.checklist) {
          if (task.status === "completed" || task.status === "blocked" || !task.dueDate) continue;
          const days = differenceInCalendarDays(parseISO(task.dueDate), now);

          let key: string | null = null;
          let title = "";
          let type: "urgent" | "info" = "urgent";
          if (days < 0) {
            key = `deadline:${file.id}:${task.id}:overdue`;
            title = `Overdue: ${task.title}`;
          } else if (days <= 1) {
            key = `deadline:${file.id}:${task.id}:1d`;
            title = days === 0 ? `Due today: ${task.title}` : `Due tomorrow: ${task.title}`;
          } else if (days <= 3) {
            key = `deadline:${file.id}:${task.id}:3d`;
            title = `Deadline in ${days} days: ${task.title}`;
            type = "info";
          }
          if (!key) continue;

          // Only a couple of toasts per tick — the rest go quietly to the bell,
          // so opening the app never produces a wall of pop-ups.
          raise(
            key,
            {
              fileId: file.id,
              title,
              message: `${label} · due ${format(parseISO(task.dueDate), "EEE, MMM d")}`,
              type,
            },
            announced++ < 2
          );
        }
      }
    };

    const first = setTimeout(run, 1500);
    const interval = setInterval(run, TICK_MS);
    return () => {
      clearTimeout(first);
      clearInterval(interval);
    };
  }, [isAuthenticated]);
}
