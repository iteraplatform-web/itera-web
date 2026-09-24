"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Bell,
  Calendar,
  Check,
  CheckCircle2,
  ClipboardList,
  Clock,
} from "lucide-react";
import { AuthGuard } from "@/components/layout/auth-guard";
import { AppShell } from "@/components/layout/app-shell";
import { sectionHref } from "@/components/workspace/workspace-sidebar";
import { EmptyState, Segmented } from "@/components/ui/misc";
import { formatDate } from "@/lib/utils/dates";
import { useTransactionsStore } from "@/stores";
import { getPortfolioActionItems } from "@/lib/selectors/transactions";
import { ensureWorkFields } from "@/lib/work/defaults";
import { PHASE_LABELS, type PortfolioActionItem } from "@/types";
import { cn } from "@/lib/utils/cn";

export default function TasksPage() {
  return (
    <AuthGuard>
      <TasksContent />
    </AuthGuard>
  );
}

type Kind = "all" | "task" | "reminder";

function TasksContent() {
  const files = useTransactionsStore((s) => s.files);
  const toggleTask = useTransactionsStore((s) => s.toggleTask);
  const toggleReminder = useTransactionsStore((s) => s.toggleReminder);
  const [kind, setKind] = useState<Kind>("all");

  const normalized = useMemo(() => files.map(ensureWorkFields), [files]);
  const allItems = useMemo(() => getPortfolioActionItems(normalized), [normalized]);
  const items = useMemo(
    () => (kind === "all" ? allItems : allItems.filter((i) => i.kind === kind)),
    [allItems, kind]
  );

  const overdue = items.filter((i) => i.isOverdue);
  const today = items.filter((i) => !i.isOverdue && i.daysRemaining === 0);
  const week = items.filter((i) => !i.isOverdue && i.daysRemaining > 0 && i.daysRemaining <= 6);
  const later = items.filter((i) => !i.isOverdue && i.daysRemaining > 6);

  const complete = (item: PortfolioActionItem) => {
    if (item.kind === "task") toggleTask(item.fileId, item.id);
    else toggleReminder(item.fileId, item.id);
  };

  return (
    <AppShell crumbs={[{ label: "Home", href: "/dashboard" }, { label: "Tasks" }]}>
      <div className="mx-auto max-w-4xl space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-serif text-[34px] font-medium leading-tight tracking-[-0.01em] text-ink-950">
              Tasks
            </h1>
            <p className="mt-0.5 text-[15px] text-ink-500">
              Every open task and reminder across your portfolio — nothing hides inside a single file.
            </p>
          </div>
        </div>

        <div className="stagger grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline shadow-sm sm:grid-cols-3">
          <StatTile label="Overdue" value={overdue.length} icon={AlertCircle} alert={overdue.length > 0} />
          <StatTile label="Due today" value={today.length} icon={Clock} />
          <StatTile label="Due this week" value={week.length} icon={Calendar} />
        </div>

        <div className="flex items-center justify-between">
          <Segmented
            value={kind}
            onChange={setKind}
            size="sm"
            options={[
              { value: "all", label: "All" },
              { value: "task", label: "Tasks" },
              { value: "reminder", label: "Reminders" },
            ]}
          />
          <p className="text-[13px] text-ink-500">
            <span className="tnum font-semibold text-ink-700">{items.length}</span> open
          </p>
        </div>

        {items.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="Nothing outstanding"
            description="Every task and reminder across your open files is done or not due yet."
          />
        ) : (
          <div className="space-y-6">
            <TaskGroup title="Overdue" tone="red" items={overdue} onComplete={complete} />
            <TaskGroup title="Due today" tone="amber" items={today} onComplete={complete} />
            <TaskGroup title="Due this week" tone="ink" items={week} onComplete={complete} />
            <TaskGroup title="Later" tone="gray" items={later} onComplete={complete} />
          </div>
        )}
      </div>
    </AppShell>
  );
}

function StatTile({
  label,
  value,
  icon: Icon,
  alert,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  alert?: boolean;
}) {
  return (
    <div className={cn("relative bg-surface px-5 py-4", alert && value > 0 && "bg-red-50/50")}>
      <div className="flex items-center justify-between">
        <p className="section-title">{label}</p>
        <Icon className={cn("h-4 w-4", alert && value > 0 ? "text-red-600" : "text-ink-400")} />
      </div>
      <p
        className={cn(
          "tnum mt-2.5 text-[28px] font-bold leading-none tracking-[-0.03em]",
          alert && value > 0 ? "text-red-700" : "text-ink-950"
        )}
      >
        {value}
      </p>
    </div>
  );
}

const GROUP_TONE = {
  red: "text-red-700",
  amber: "text-amber-700",
  ink: "text-ink-700",
  gray: "text-ink-500",
} as const;

function TaskGroup({
  title,
  tone,
  items,
  onComplete,
}: {
  title: string;
  tone: keyof typeof GROUP_TONE;
  items: PortfolioActionItem[];
  onComplete: (item: PortfolioActionItem) => void;
}) {
  if (items.length === 0) return null;

  return (
    <div>
      <h2 className={cn("mb-2 text-[13px] font-semibold uppercase tracking-[0.06em]", GROUP_TONE[tone])}>
        {title} <span className="tnum text-ink-400">· {items.length}</span>
      </h2>
      <div className="overflow-hidden rounded-2xl border border-hairline bg-surface shadow-sm">
        {items.map((item, i) => (
          <div
            key={`${item.kind}-${item.id}`}
            className={cn(
              "flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-canvas",
              i > 0 && "border-t border-hairline"
            )}
          >
            <button
              onClick={() => onComplete(item)}
              aria-label={item.kind === "task" ? `Complete ${item.title}` : `Mark ${item.title} done`}
              className="group mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-surface ring-1 ring-inset ring-ink-300 transition-colors hover:bg-emerald-50 hover:ring-emerald-400"
            >
              <Check className="h-4 w-4 text-transparent transition-colors group-hover:text-emerald-600" />
            </button>

            <div className="min-w-0 flex-1">
              <Link href={sectionHref(item.fileId, item.section, item.focus)} className="block">
                <p className="truncate text-[15px] font-medium text-ink-900 hover:text-itera-700">{item.title}</p>
              </Link>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-ink-500">
                <span className="inline-flex items-center gap-1">
                  {item.kind === "task" ? (
                    <ClipboardList className="h-3.5 w-3.5" />
                  ) : (
                    <Bell className="h-3.5 w-3.5" />
                  )}
                  {item.phase && PHASE_LABELS[item.phase]}
                </span>
                <span className="text-ink-300">·</span>
                <Link href={`/files/${item.fileId}`} className="truncate font-medium text-ink-600 hover:text-itera-700">
                  {item.fileLabel}
                </Link>
              </div>
            </div>

            <span
              className={cn(
                "shrink-0 whitespace-nowrap pt-0.5 text-[13px] font-semibold",
                item.isOverdue ? "text-red-600" : item.daysRemaining === 0 ? "text-amber-700" : "text-ink-400"
              )}
            >
              {item.isOverdue
                ? `${Math.abs(item.daysRemaining)}d late`
                : item.daysRemaining === 0
                ? "Today"
                : formatDate(item.dueDate, "MMM d")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
