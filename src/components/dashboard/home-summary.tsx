"use client";

import Link from "next/link";
import { useMemo } from "react";
import { AlertTriangle, ArrowRight, CheckCircle2, Clock } from "lucide-react";
import { getMostUrgentItem } from "@/lib/selectors/transactions";
import { cn } from "@/lib/utils/cn";
import type { PortfolioStats, TransactionFile } from "@/types";


/**
 * Everything the old banner and stat cards said, in one compact row — so the
 * files themselves start above the fold.
 */
export function HomeSummary({
  files,
  stats,
}: {
  files: TransactionFile[];
  stats: PortfolioStats;
}) {
  const urgent = useMemo(() => getMostUrgentItem(files), [files]);
  const hot = urgent && (urgent.isOverdue || urgent.daysRemaining <= 3);

  const metrics = [
    { label: "Open files", value: String(stats.openFiles) },
    { label: "Closing this month", value: String(stats.closingsThisMonth) },
    { label: "Overdue tasks", value: String(stats.overdueCount), alert: stats.overdueCount > 0 },
  ];


  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      {urgent ? (
        <Link
          href={`/files/${urgent.fileId}?tab=checklist`}
          className={cn(
            "group flex items-center gap-3.5 rounded-2xl border px-4 py-3.5 transition-shadow hover:shadow-md",
            hot ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"
          )}
        >
          <span
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              hot ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700"
            )}
          >
            {urgent.isOverdue ? <AlertTriangle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
          </span>
          <span className="min-w-0 flex-1">
            <span className={cn("block text-[12px] font-bold uppercase tracking-[0.06em]", hot ? "text-red-700" : "text-amber-800")}>
              {urgent.isOverdue
                ? `Overdue ${Math.abs(urgent.daysRemaining)} day${Math.abs(urgent.daysRemaining) === 1 ? "" : "s"}`
                : urgent.daysRemaining === 0
                ? "Due today"
                : `Most urgent · ${urgent.daysRemaining} day${urgent.daysRemaining === 1 ? "" : "s"} left`}
            </span>
            <span className="block truncate text-[15px] font-semibold text-ink-950">{urgent.taskTitle}</span>
            <span className="block truncate text-[13px] text-ink-600">{urgent.fileLabel}</span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-ink-400 transition-transform group-hover:translate-x-0.5" />
        </Link>
      ) : (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5">
          <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          <p className="text-[15px] font-medium text-emerald-900">Nothing urgent across your files.</p>
        </div>
      )}

      <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline">
        {metrics.map((m) => (
          <div key={m.label} className={cn("bg-surface px-4 py-3", m.alert && "bg-red-50")}>
            <dt className="text-[13px] text-ink-500">{m.label}</dt>
            <dd className={cn("tnum mt-0.5 text-[22px] font-bold leading-tight", m.alert ? "text-red-700" : "text-ink-950")}>
              {m.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
