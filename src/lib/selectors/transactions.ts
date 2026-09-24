import { daysRemaining, isOverdue } from "@/lib/utils/dates";
import type {
  PortfolioActionItem,
  PortfolioStats,
  TransactionFile,
  TransactionStatus,
  UrgentItem,
} from "@/types";

const OPEN_STATUSES: TransactionStatus[] = [
  "prospective",
  "listed",
  "buyer_agency",
  "in_progress",
  "under_contract",
];

export function filterFiles(
  files: TransactionFile[],
  statusFilter: TransactionStatus | "all",
  sideFilter: "all" | "listing" | "buying",
  searchQuery: string
): TransactionFile[] {
  return files.filter((f) => {
    if (statusFilter !== "all" && f.status !== statusFilter) return false;
    if (sideFilter !== "all" && f.side !== sideFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        f.clientName.toLowerCase().includes(q) ||
        f.propertyAddress.toLowerCase().includes(q)
      );
    }
    return true;
  });
}

export function getPortfolioStats(files: TransactionFile[]): PortfolioStats {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  let overdueCount = 0;
  files.forEach((f) => {
    if (!OPEN_STATUSES.includes(f.status)) return;
    f.checklist.forEach((t) => {
      if (t.status !== "completed" && t.dueDate && isOverdue(t.dueDate)) {
        overdueCount++;
      }
    });
  });

  return {
    openFiles: files.filter((f) => OPEN_STATUSES.includes(f.status)).length,
    closingsThisMonth: files.filter((f) => {
      if (!f.closingDate) return false;
      const d = new Date(f.closingDate);
      return d.getMonth() === month && d.getFullYear() === year;
    }).length,
    overdueCount,
  };
}

export function getMostUrgentItem(files: TransactionFile[]): UrgentItem | null {
  let mostUrgent: UrgentItem | null = null;

  files.forEach((f) => {
    if (!OPEN_STATUSES.includes(f.status)) return;
    f.checklist.forEach((t) => {
      if (t.status === "completed" || t.status === "blocked" || !t.dueDate) return;
      const days = daysRemaining(t.dueDate);
      const overdue = isOverdue(t.dueDate);
      if (!mostUrgent || days < mostUrgent.daysRemaining) {
        mostUrgent = {
          fileId: f.id,
          fileLabel: f.propertyAddress || f.clientName,
          taskTitle: t.title,
          daysRemaining: days,
          isOverdue: overdue,
        };
      }
    });
  });

  return mostUrgent;
}

export function getFileById(files: TransactionFile[], id: string): TransactionFile | undefined {
  return files.find((f) => f.id === id);
}

/**
 * Every open, ready-to-work checklist task and every unfinished reminder,
 * across every open file, as one flat list sorted soonest-first. This is
 * what the single urgent banner can only hint at one item of at a time.
 */
export function getPortfolioActionItems(files: TransactionFile[]): PortfolioActionItem[] {
  const items: PortfolioActionItem[] = [];

  files.forEach((f) => {
    if (!OPEN_STATUSES.includes(f.status)) return;
    const fileLabel = f.propertyAddress && f.propertyAddress !== "TBD" ? f.propertyAddress : f.clientName;

    f.checklist.forEach((t) => {
      if (t.status === "completed" || t.status === "blocked" || !t.dueDate) return;
      items.push({
        id: t.id,
        kind: "task",
        fileId: f.id,
        fileLabel,
        clientName: f.clientName,
        title: t.title,
        dueDate: t.dueDate,
        daysRemaining: daysRemaining(t.dueDate),
        isOverdue: isOverdue(t.dueDate),
        phase: t.phase,
        section: t.workTarget?.section ?? "checklist",
        focus: t.workTarget?.focus ?? t.id,
      });
    });

    (f.reminders ?? []).forEach((r) => {
      if (r.done) return;
      items.push({
        id: r.id,
        kind: "reminder",
        fileId: f.id,
        fileLabel,
        clientName: f.clientName,
        title: r.title,
        dueDate: r.dueAt,
        daysRemaining: daysRemaining(r.dueAt),
        isOverdue: isOverdue(r.dueAt),
        section: "overview",
      });
    });
  });

  return items.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}
