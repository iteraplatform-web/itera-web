"use client";

import Link from "next/link";
import {
  ArrowRightLeft,
  CheckCircle2,
  FileText,
  History,
  MessageSquare,
  StickyNote,
} from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import type { RecentActivityItem } from "@/lib/selectors/file-metrics";
import { EmptyState } from "@/components/ui/misc";
import { cn } from "@/lib/utils/cn";

const TYPE_STYLE: Record<string, { icon: React.ElementType; tone: string }> = {
  task_completed: { icon: CheckCircle2, tone: "bg-emerald-50 text-emerald-600" },
  status_change: { icon: ArrowRightLeft, tone: "bg-itera-50 text-itera-600" },
  document_received: { icon: FileText, tone: "bg-sky-50 text-sky-600" },
  message_sent: { icon: MessageSquare, tone: "bg-violet-50 text-violet-600" },
  note_added: { icon: StickyNote, tone: "bg-amber-50 text-amber-600" },
  cma_updated: { icon: CheckCircle2, tone: "bg-itera-50 text-itera-600" },
  listing_updated: { icon: FileText, tone: "bg-sky-50 text-sky-600" },
  showing_logged: { icon: History, tone: "bg-amber-50 text-amber-600" },
  marketing_updated: { icon: MessageSquare, tone: "bg-violet-50 text-violet-600" },
  milestone_updated: { icon: CheckCircle2, tone: "bg-emerald-50 text-emerald-600" },
  profile_updated: { icon: StickyNote, tone: "bg-ink-100 text-ink-600" },
  prep_updated: { icon: FileText, tone: "bg-amber-50 text-amber-600" },
  media_updated: { icon: FileText, tone: "bg-sky-50 text-sky-600" },
  agreement_updated: { icon: FileText, tone: "bg-itera-50 text-itera-600" },
};

export function RecentActivityPanel({ items }: { items: RecentActivityItem[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-hairline bg-surface shadow-sm">
      <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
        <div>
          <h3 className="text-[15px] font-semibold text-ink-950">Recent activity</h3>
          <p className="text-[13px] text-ink-500">Across your whole portfolio</p>
        </div>
        <History className="h-4 w-4 text-ink-400" />
      </div>

      <div className="max-h-[520px] overflow-y-auto">
        {items.length === 0 ? (
          <EmptyState
            icon={History}
            title="No activity yet"
            description="Completed tasks and status changes show up here."
            className="m-3 border-0 bg-transparent"
          />
        ) : (
          <ol className="relative px-5 py-4">
            {/* Continuous rail behind the markers ties the entries together. */}
            <span className="absolute bottom-6 left-[31px] top-6 w-px bg-hairline" />
            {items.map((item) => {
              const style = TYPE_STYLE[item.type] ?? TYPE_STYLE.task_completed;
              const Icon = style.icon;
              return (
                <li key={item.id} className="relative">
                  <Link
                    href={`/files/${item.fileId}`}
                    className="group -mx-2 flex gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-canvas"
                  >
                    <span
                      className={cn(
                        "z-10 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-4 ring-surface",
                        style.tone
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[14px] leading-snug text-ink-800">
                        {item.description}
                      </span>
                      <span className="mt-0.5 block truncate text-[13px] text-ink-500 group-hover:text-ink-600">
                        {item.fileLabel}
                      </span>
                      <span className="mt-1 block text-[13px] text-ink-400">
                        {item.actor} ·{" "}
                        {formatDistanceToNow(parseISO(item.createdAt), { addSuffix: true })}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
