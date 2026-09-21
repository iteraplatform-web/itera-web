import type { TransactionStatus, TaskStatus } from "@/types";

/**
 * The scope document fixes four meanings: green = on track / complete,
 * amber = pending / in progress, red = needs attention, gray = not started.
 * Every status below maps onto exactly one of those four so a color never
 * has to be explained twice.
 */
export const STATUS_THEME: Record<
  TransactionStatus,
  {
    label: string;
    /** The four-color meaning this status belongs to. */
    meaning: "green" | "amber" | "red" | "gray";
    dot: string;
    bg: string;
    border: string;
    text: string;
    /** Solid fill used for accent rails and filled chips. */
    solid: string;
    columnBg: string;
    columnAccent: string;
  }
> = {
  prospective: {
    label: "Prospective",
    meaning: "gray",
    dot: "bg-ink-400",
    bg: "bg-ink-100",
    border: "border-ink-200",
    text: "text-ink-600",
    solid: "bg-ink-400",
    columnBg: "bg-ink-50",
    columnAccent: "bg-ink-300",
  },
  listed: {
    label: "Listed",
    meaning: "green",
    dot: "bg-emerald-500",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    solid: "bg-emerald-500",
    columnBg: "bg-emerald-50/40",
    columnAccent: "bg-emerald-400",
  },
  buyer_agency: {
    label: "Buyer Agency",
    meaning: "green",
    dot: "bg-emerald-500",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    solid: "bg-emerald-500",
    columnBg: "bg-emerald-50/40",
    columnAccent: "bg-emerald-400",
  },
  in_progress: {
    label: "In Progress",
    meaning: "amber",
    dot: "bg-amber-500",
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    solid: "bg-amber-500",
    columnBg: "bg-amber-50/40",
    columnAccent: "bg-amber-400",
  },
  under_contract: {
    label: "Under Contract",
    meaning: "amber",
    dot: "bg-amber-600",
    bg: "bg-amber-100/70",
    border: "border-amber-300",
    text: "text-amber-800",
    solid: "bg-amber-600",
    columnBg: "bg-amber-50/70",
    columnAccent: "bg-amber-500",
  },
  closed: {
    label: "Closed",
    meaning: "green",
    dot: "bg-emerald-600",
    bg: "bg-emerald-100/70",
    border: "border-emerald-300",
    text: "text-emerald-800",
    solid: "bg-emerald-600",
    columnBg: "bg-emerald-50/60",
    columnAccent: "bg-emerald-500",
  },
  dropped: {
    label: "Dropped",
    meaning: "gray",
    dot: "bg-ink-300",
    bg: "bg-ink-50",
    border: "border-ink-200",
    text: "text-ink-500",
    solid: "bg-ink-300",
    columnBg: "bg-ink-50",
    columnAccent: "bg-ink-200",
  },
  terminated: {
    label: "Terminated",
    meaning: "red",
    dot: "bg-red-500",
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
    solid: "bg-red-500",
    columnBg: "bg-red-50/40",
    columnAccent: "bg-red-400",
  },
};

export const KANBAN_COLUMNS: TransactionStatus[] = [
  "prospective",
  "listed",
  "buyer_agency",
  "in_progress",
  "under_contract",
  "closed",
  "dropped",
  "terminated",
];

export const TASK_STATUS_THEME: Record<
  TaskStatus,
  { bg: string; text: string; ring: string; label: string }
> = {
  not_started: { bg: "bg-ink-100", text: "text-ink-500", ring: "ring-ink-200/70", label: "Not started" },
  in_progress: { bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-200/70", label: "In progress" },
  completed: { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200/70", label: "Complete" },
  blocked: { bg: "bg-ink-100", text: "text-ink-400", ring: "ring-ink-200/70", label: "Waiting" },
};

export function getDeadlineUrgency(dueDate: string): "urgent" | "warning" | "ok" {
  const days = Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days <= 3) return "urgent";
  if (days <= 7) return "warning";
  return "ok";
}

export const DEADLINE_THEME = {
  urgent: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
    badge: "bg-red-100 text-red-800",
    solid: "bg-red-500",
  },
  warning: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    badge: "bg-amber-100 text-amber-800",
    solid: "bg-amber-500",
  },
  ok: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    badge: "bg-emerald-100 text-emerald-800",
    solid: "bg-emerald-500",
  },
};

/** Maps a status onto the Badge component's variant vocabulary. */
export function statusBadgeVariant(status: TransactionStatus) {
  return STATUS_THEME[status].meaning;
}
