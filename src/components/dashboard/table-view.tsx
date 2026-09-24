"use client";

import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/misc";
import { getFileProgress, getMostUrgentTask } from "@/lib/selectors/file-metrics";
import { daysRemaining, formatDate, isOverdue } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";
import { SlidersHorizontal } from "lucide-react";
import type { TransactionFile } from "@/types";

/**
 * The same files as the card grid, laid out as rows so a full portfolio can
 * be scanned at a glance — everything on one line instead of one card apiece.
 */
export function TableView({ files }: { files: TransactionFile[] }) {
  const router = useRouter();

  if (files.length === 0) {
    return (
      <EmptyState
        icon={SlidersHorizontal}
        title="No files match these filters"
        description="Try a different status or side, or clear the search."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-hairline bg-surface shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] border-collapse text-left text-[14px]">
          <thead>
            <tr className="border-b border-hairline bg-canvas text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-500">
              <th className="px-5 py-3 font-semibold">File</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Side</th>
              <th className="px-4 py-3 font-semibold">Price</th>
              <th className="px-4 py-3 font-semibold">Progress</th>
              <th className="px-4 py-3 font-semibold">Next task</th>
              <th className="px-4 py-3 font-semibold">Updated</th>
            </tr>
          </thead>
          <tbody>
            {files.map((file) => {
              const next = getMostUrgentTask(file);
              const days = next?.dueDate ? daysRemaining(next.dueDate) : null;
              const late = next?.dueDate ? isOverdue(next.dueDate) : false;
              const progress = getFileProgress(file);
              const dueTone = days === null ? "text-ink-400" : late || days === 0 ? "text-red-700 font-semibold" : days <= 7 ? "text-amber-700 font-semibold" : "text-ink-500";
              const dueLabel =
                days === null ? "" : late ? `${Math.abs(days)}d late` : days === 0 ? "Due today" : `${days}d left`;

              return (
                <tr
                  key={file.id}
                  onClick={() => router.push(`/files/${file.id}`)}
                  className="cursor-pointer border-b border-hairline last:border-0 transition-colors hover:bg-canvas"
                >
                  <td className="max-w-[280px] px-5 py-3.5">
                    <p className="truncate font-semibold text-ink-950">{file.propertyAddress || file.clientName}</p>
                    <p className="truncate text-[13px] text-ink-500">{file.clientName}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={file.status} size="sm" />
                  </td>
                  <td className="px-4 py-3.5 text-ink-600">{file.side === "listing" ? "Selling" : "Buying"}</td>
                  <td className="tnum px-4 py-3.5 font-medium text-ink-900">
                    {file.listPrice > 0 ? `$${file.listPrice.toLocaleString()}` : "—"}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-ink-100">
                        <div
                          className={cn("h-full rounded-full", progress >= 100 ? "bg-emerald-500" : "bg-itera-500")}
                          style={{ width: `${Math.min(100, progress)}%` }}
                        />
                      </div>
                      <span className="tnum text-[13px] text-ink-500">{Math.round(progress)}%</span>
                    </div>
                  </td>
                  <td className="max-w-[220px] px-4 py-3.5">
                    <p className="truncate text-ink-700" title={next?.title}>
                      {next ? next.title : "All caught up"}
                    </p>
                    {dueLabel && <p className={cn("text-[12.5px]", dueTone)}>{dueLabel}</p>}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-ink-500">{formatDate(file.updatedAt, "MMM d")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
