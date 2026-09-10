import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { v4 as uuid } from "uuid";
import { SEED_NOTIFICATIONS } from "@/lib/seed/data";
import type { Notification, NotificationType } from "@/types";

interface NotificationsState {
  notifications: Notification[];
  initialized: boolean;

  initialize: () => void;
  addNotification: (data: {
    fileId?: string;
    title: string;
    message: string;
    type: NotificationType;
    dedupeKey?: string;
  }) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  getUnreadCount: () => number;
}

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    immer((set, get) => ({
      notifications: [],
      initialized: false,

      initialize: () => {
        const state = get();
        if (!state.initialized || state.notifications.length === 0) {
          set((s) => {
            s.notifications = SEED_NOTIFICATIONS;
            s.initialized = true;
          });
        }
      },

      addNotification: (data) => {
        set((s) => {
          s.notifications.unshift({
            id: uuid(),
            ...data,
            read: false,
            createdAt: new Date().toISOString(),
          });
        });
      },

      markRead: (id) => {
        set((s) => {
          const n = s.notifications.find((n) => n.id === id);
          if (n) n.read = true;
        });
      },

      markAllRead: () => {
        set((s) => {
          s.notifications.forEach((n) => { n.read = true; });
        });
      },

      getUnreadCount: () => get().notifications.filter((n) => !n.read).length,
    })),
    {
      name: "itera-notifications",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        notifications: state.notifications,
        initialized: state.initialized,
      }),
      // Seeding runs through initialize() so the result is actually persisted;
      // see the note in transactions-store.ts.
    }
  )
);
