"use client";

import Link from "next/link";
import { AlertTriangle, Bell, CheckCircle2, Info } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { useNotificationsStore } from "@/stores";
import { EmptyState } from "@/components/ui/misc";
import { cn } from "@/lib/utils/cn";
import type { NotificationType } from "@/types";

const TONE: Record<NotificationType, { icon: React.ElementType; wrap: string }> = {
  urgent: { icon: AlertTriangle, wrap: "bg-red-50 text-red-600 ring-red-100" },
  success: { icon: CheckCircle2, wrap: "bg-emerald-50 text-emerald-600 ring-emerald-100" },
  info: { icon: Info, wrap: "bg-itera-50 text-itera-600 ring-itera-100" },
};

export function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const notifications = useNotificationsStore((s) => s.notifications);
  const markRead = useNotificationsStore((s) => s.markRead);
  const markAllRead = useNotificationsStore((s) => s.markAllRead);
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="absolute right-0 top-full z-50 mt-2 w-[360px] origin-top-right animate-fade-in overflow-hidden rounded-2xl border border-hairline bg-surface shadow-xl">
      <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
        <div>
          <h3 className="text-[15px] font-semibold text-ink-950">Notifications</h3>
          <p className="text-[13px] text-ink-500">
            {unread > 0 ? `${unread} unread` : "You're all caught up"}
          </p>
        </div>
        {unread > 0 && (
          <button
            onClick={markAllRead}
            className="text-[13px] font-semibold text-itera-600 hover:text-itera-700"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        {notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="Nothing to report"
            description="Alerts about deadlines, offers, and documents appear here."
            className="m-3 border-0 bg-transparent py-10"
          />
        ) : (
          notifications.map((n) => {
            const tone = TONE[n.type];
            const Icon = tone.icon;
            const body = (
              <>
                <span
                  className={cn(
                    "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset",
                    tone.wrap
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-start justify-between gap-2">
                    <span className="text-[14px] font-semibold text-ink-950">{n.title}</span>
                    {!n.read && (
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-itera-500" />
                    )}
                  </span>
                  <span className="mt-0.5 block text-[13px] leading-snug text-ink-500">
                    {n.message}
                  </span>
                  <span className="mt-1 block text-[13px] text-ink-400">
                    {formatDistanceToNow(parseISO(n.createdAt), { addSuffix: true })}
                  </span>
                </span>
              </>
            );

            const className = cn(
              "flex w-full gap-3 border-b border-hairline px-4 py-3 text-left transition-colors last:border-0",
              n.read ? "hover:bg-canvas" : "bg-itera-50/40 hover:bg-itera-50/70"
            );

            return n.fileId ? (
              <Link
                key={n.id}
                href={`/files/${n.fileId}`}
                onClick={() => {
                  markRead(n.id);
                  onClose();
                }}
                className={className}
              >
                {body}
              </Link>
            ) : (
              <button key={n.id} onClick={() => markRead(n.id)} className={className}>
                {body}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
