"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, Clock } from "lucide-react";
import { useMemo } from "react";
import { useTransactionsStore } from "@/stores";
import { getMostUrgentItem } from "@/lib/selectors/transactions";
import { cn } from "@/lib/utils/cn";

/**
 * One banner, one item: the single most pressing thing across the whole
 * portfolio — not whatever file was touched last.
 */
export function UrgentBanner() {
  const files = useTransactionsStore((s) => s.files);
  const urgent = useMemo(() => getMostUrgentItem(files), [files]);

  if (!urgent) return null;

  const level = urgent.isOverdue
    ? "overdue"
    : urgent.daysRemaining <= 3
    ? "urgent"
    : urgent.daysRemaining <= 7
    ? "soon"
    : "calm";

  const styles = {
    overdue: {
      wrap: "border-red-200 bg-gradient-to-r from-red-50 to-red-50/40",
      chip: "bg-red-600 text-white",
      icon: "bg-red-100 text-red-600",
      eyebrow: "text-red-700",
    },
    urgent: {
      wrap: "border-red-200 bg-gradient-to-r from-red-50 to-red-50/30",
      chip: "bg-red-100 text-red-800",
      icon: "bg-red-100 text-red-600",
      eyebrow: "text-red-700",
    },
    soon: {
      wrap: "border-amber-200 bg-gradient-to-r from-amber-50 to-amber-50/30",
      chip: "bg-amber-100 text-amber-800",
      icon: "bg-amber-100 text-amber-600",
      eyebrow: "text-amber-700",
    },
    calm: {
      wrap: "border-hairline bg-surface",
      chip: "bg-emerald-100 text-emerald-800",
      icon: "bg-emerald-50 text-emerald-600",
      eyebrow: "text-ink-500",
    },
  }[level];

  return (
    <Link
      href={`/files/${urgent.fileId}`}
      className={cn(
        // Stacks on narrow screens so the task title never truncates to nothing.
        "group flex flex-col gap-3 rounded-2xl border px-5 py-4 shadow-sm transition-all hover:shadow-md sm:flex-row sm:items-center sm:gap-4",
        styles.wrap
      )}
    >
      <div className={cn("relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl sm:order-first", styles.icon)}>
        {level === "overdue" ? (
          <AlertTriangle className="h-5 w-5" />
        ) : (
          <Clock className="h-5 w-5" />
        )}
        {level === "overdue" && (
          <span className="absolute inset-0 animate-ping rounded-xl bg-red-400/40" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className={cn("text-[12px] font-bold uppercase tracking-[0.07em]", styles.eyebrow)}>
          {level === "overdue"
            ? "Overdue — needs attention now"
            : "Most urgent across your portfolio"}
        </p>
        <p className="mt-1 truncate text-[16px] font-semibold text-ink-950">
          {urgent.taskTitle}
        </p>
        <p className="mt-0.5 truncate text-[13px] text-ink-500">{urgent.fileLabel}</p>
      </div>

      <div className="flex shrink-0 items-center gap-3 self-start sm:self-auto">
        <span className={cn("tnum rounded-full px-3 py-1.5 text-[14px] font-bold", styles.chip)}>
          {urgent.isOverdue
            ? `${Math.abs(urgent.daysRemaining)}d overdue`
            : urgent.daysRemaining === 0
            ? "Due today"
            : `${urgent.daysRemaining}d left`}
        </span>
        <ArrowRight className="h-4 w-4 text-ink-400 transition-transform group-hover:translate-x-0.5 group-hover:text-ink-600" />
      </div>
    </Link>
  );
}
