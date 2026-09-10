"use client";

import { STATUS_THEME, KANBAN_COLUMNS } from "@/lib/utils/status-theme";
import type { TransactionFile, TransactionStatus } from "@/types";
import { cn } from "@/lib/utils/cn";

export function PipelineBar({
  files,
  onSelectStatus,
  activeStatus,
}: {
  files: TransactionFile[];
  onSelectStatus?: (status: TransactionStatus | "all") => void;
  activeStatus?: TransactionStatus | "all";
}) {
  const total = files.length || 1;
  const present = KANBAN_COLUMNS.map((status) => ({
    status,
    count: files.filter((f) => f.status === status).length,
  })).filter((s) => s.count > 0);

  return (
    <div className="rounded-2xl border border-hairline bg-surface p-5 shadow-sm">
      <div className="mb-3.5 flex items-baseline justify-between">
        <h3 className="text-[15px] font-semibold text-ink-950">Pipeline</h3>
        <p className="text-[13px] text-ink-500">
          <span className="tnum font-semibold text-ink-700">{files.length}</span> files across{" "}
          <span className="tnum font-semibold text-ink-700">{present.length}</span> stages
        </p>
      </div>

      {/* Proportional bar — each segment is clickable as a status filter. */}
      <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full">
        {present.map(({ status, count }) => {
          const theme = STATUS_THEME[status];
          return (
            <button
              key={status}
              onClick={() => onSelectStatus?.(activeStatus === status ? "all" : status)}
              style={{ width: `${(count / total) * 100}%` }}
              className={cn(
                "h-full rounded-full transition-all duration-300 hover:opacity-80",
                theme.solid,
                activeStatus && activeStatus !== status && "opacity-30"
              )}
              title={`${theme.label}: ${count}`}
              aria-label={`Filter to ${theme.label}`}
            />
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
        {present.map(({ status, count }) => {
          const theme = STATUS_THEME[status];
          const active = activeStatus === status;
          return (
            <button
              key={status}
              onClick={() => onSelectStatus?.(active ? "all" : status)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-1 py-0.5 transition-colors hover:bg-ink-50",
                active && "bg-ink-100"
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", theme.solid)} />
              <span className="text-[13px] text-ink-500">{theme.label}</span>
              <span className="tnum text-[13px] font-bold text-ink-900">{count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
