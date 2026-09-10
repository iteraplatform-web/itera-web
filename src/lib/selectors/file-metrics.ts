import type { TransactionFile, ChecklistTask } from "@/types";
import { daysRemaining, isOverdue } from "@/lib/utils/dates";

export function getFileProgress(file: TransactionFile): number {
  const total = file.checklist.length;
  if (total === 0) return 0;
  const completed = file.checklist.filter((t) => t.status === "completed").length;
  return Math.round((completed / total) * 100);
}

export function getMostUrgentTask(file: TransactionFile): ChecklistTask | undefined {
  const open = file.checklist.filter(
    (t) => t.status !== "completed" && t.status !== "blocked" && t.dueDate
  );
  if (open.length === 0) {
    return file.checklist.find((t) => t.status !== "completed" && t.status !== "blocked");
  }
  return open.sort((a, b) => daysRemaining(a.dueDate!) - daysRemaining(b.dueDate!))[0];
}

export function getOverdueTaskCount(file: TransactionFile): number {
  return file.checklist.filter(
    (t) => t.status !== "completed" && t.dueDate && isOverdue(t.dueDate)
  ).length;
}

export function getPendingDocumentCount(file: TransactionFile): number {
  return file.documents.filter((d) => d.status === "needed").length;
}

export function getUnreadMessageCount(file: TransactionFile): number {
  return file.messages.filter((m) => m.sender === "client").length;
}

export interface RecentActivityItem {
  id: string;
  fileId: string;
  fileLabel: string;
  description: string;
  actor: string;
  createdAt: string;
  type: string;
}

export function getRecentActivity(files: TransactionFile[], limit = 8): RecentActivityItem[] {
  const items: RecentActivityItem[] = [];
  files.forEach((f) => {
    // Take a generous slice per file; the global sort below decides what shows.
    f.activity.slice(0, 8).forEach((a) => {
      items.push({
        id: a.id,
        fileId: f.id,
        fileLabel: f.propertyAddress || f.clientName,
        description: a.description,
        actor: a.actor,
        createdAt: a.createdAt,
        type: a.type,
      });
    });
  });
  return items
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

export function getPipelineCounts(files: TransactionFile[]) {
  return {
    prospective: files.filter((f) => f.status === "prospective").length,
    active: files.filter((f) =>
      ["listed", "buyer_agency", "in_progress", "under_contract"].includes(f.status)
    ).length,
    closed: files.filter((f) => f.status === "closed").length,
    atRisk: files.filter((f) => ["dropped", "terminated"].includes(f.status)).length,
  };
}

export function getTotalPipelineValue(files: TransactionFile[]): number {
  const active = ["prospective", "listed", "buyer_agency", "in_progress", "under_contract"];
  return files
    .filter((f) => active.includes(f.status) && f.listPrice > 0)
    .reduce((sum, f) => sum + f.listPrice, 0);
}

export function getPortfolioWorkStats(files: TransactionFile[]) {
  const open = files.filter((f) =>
    ["prospective", "listed", "buyer_agency", "in_progress", "under_contract"].includes(f.status)
  );

  const listingOpen = open.filter((f) => f.side === "listing");
  const domValues = listingOpen
    .map((f) => daysOnMarketSafe(f))
    .filter((d): d is number => d !== null);
  const avgDaysOnMarket =
    domValues.length > 0
      ? Math.round(domValues.reduce((a, b) => a + b, 0) / domValues.length)
      : null;

  let totalShowings = 0;
  let filesWithShowingsAndOffers = 0;
  let filesWithShowings = 0;

  open.forEach((f) => {
    const count = f.showings?.appointments?.length ?? 0;
    totalShowings += count;
    if (count > 0) {
      filesWithShowings += 1;
      if (f.offers.length > 0) filesWithShowingsAndOffers += 1;
    }
  });

  const showingsToOfferRate =
    filesWithShowings > 0
      ? Math.round((filesWithShowingsAndOffers / filesWithShowings) * 100)
      : null;

  const filesMissingCma = listingOpen.filter(
    (f) => !f.cma?.recommendedPrice || (f.cma?.comps?.length ?? 0) === 0
  ).length;

  const filesMissingListingSheet = listingOpen.filter(
    (f) => !f.listingDetails?.beds || !f.listingDetails?.publicRemarks?.trim()
  ).length;

  return {
    avgDaysOnMarket,
    showingsToOfferRate,
    totalShowings,
    filesMissingCma,
    filesMissingListingSheet,
    pipelineValue: getTotalPipelineValue(files),
  };
}

function daysOnMarketSafe(file: TransactionFile): number | null {
  if (file.side !== "listing") return null;
  if (!["listed", "under_contract", "closed", "terminated"].includes(file.status)) return null;
  const start = file.listingDetails?.publishedAt
    ? new Date(file.listingDetails.publishedAt)
    : new Date(file.createdAt);
  const end =
    file.status === "closed" && file.closingDate
      ? new Date(file.closingDate)
      : file.status === "under_contract" || file.status === "terminated"
        ? new Date(file.updatedAt)
        : new Date();
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
}
