import { differenceInDays, format, isPast, parseISO } from "date-fns";
import type { TransactionStatus } from "@/types";

export function formatDate(date: string | Date, pattern = "MMM d, yyyy"): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, pattern);
}

export function daysRemaining(dueDate: string): number {
  return differenceInDays(parseISO(dueDate), new Date());
}

export function isOverdue(dueDate: string): boolean {
  return isPast(parseISO(dueDate));
}

export function formatDaysRemaining(dueDate: string): string {
  const days = daysRemaining(dueDate);
  if (days < 0) return `${Math.abs(days)} days overdue`;
  if (days === 0) return "Due today";
  if (days === 1) return "1 day left";
  return `${days} days left`;
}

export const STATUS_COLORS: Record<TransactionStatus, { bg: string; text: string; border: string }> = {
  prospective: { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-300" },
  listed: { bg: "bg-green-100", text: "text-green-800", border: "border-green-300" },
  buyer_agency: { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-300" },
  in_progress: { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-300" },
  under_contract: { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-300" },
  closed: { bg: "bg-green-100", text: "text-green-800", border: "border-green-300" },
  dropped: { bg: "bg-gray-100", text: "text-gray-500", border: "border-gray-200" },
  terminated: { bg: "bg-red-100", text: "text-red-800", border: "border-red-300" },
};

export const URGENCY_COLORS = {
  onTrack: { bg: "bg-green-100", text: "text-green-800" },
  pending: { bg: "bg-amber-100", text: "text-amber-800" },
  urgent: { bg: "bg-red-100", text: "text-red-800" },
  neutral: { bg: "bg-gray-100", text: "text-gray-600" },
} as const;

export function getUrgencyColor(days: number, isOverdueFlag: boolean) {
  if (isOverdueFlag || days < 0) return URGENCY_COLORS.urgent;
  if (days <= 3) return URGENCY_COLORS.urgent;
  if (days <= 7) return URGENCY_COLORS.pending;
  return URGENCY_COLORS.onTrack;
}
