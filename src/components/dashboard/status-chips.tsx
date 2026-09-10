"use client";

import { STATUS_THEME, KANBAN_COLUMNS } from "@/lib/utils/status-theme";
import { cn } from "@/lib/utils/cn";
import type { TransactionFile, TransactionStatus } from "@/types";

/** The pipeline, as a one-line filter: every stage with its count. */
export function StatusChips({
  files,
  active,
  onChange,
}: {
  files: TransactionFile[];
  active: TransactionStatus | "all";
  onChange: (s: TransactionStatus | "all") => void;
}) {
  const present = KANBAN_COLUMNS.map((status) => ({ status, count: files.filter((f) => f.status === status).length })).filter(
    (s) => s.count > 0
  );

  const chip = (isActive: boolean) =>
    cn(
      "inline-flex h-9 shrink-0 items-center gap-2 rounded-full px-3.5 text-[14px] font-semibold transition-colors",
      isActive ? "bg-ink-950 text-white" : "bg-surface text-ink-700 ring-1 ring-inset ring-hairline-strong hover:bg-canvas"
    );

  return (
    <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 py-0.5">
      <button onClick={() => onChange("all")} className={chip(active === "all")}>
        All
        <span className="tnum opacity-70">{files.length}</span>
      </button>
      {present.map(({ status, count }) => (
        <button key={status} onClick={() => onChange(active === status ? "all" : status)} className={chip(active === status)}>
          <span className={cn("h-2 w-2 rounded-full", STATUS_THEME[status].solid)} />
          {STATUS_THEME[status].label}
          <span className="tnum opacity-70">{count}</span>
        </button>
      ))}
    </div>
  );
}
