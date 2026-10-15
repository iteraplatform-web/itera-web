import { addDays, differenceInCalendarDays, format, parseISO, startOfDay } from "date-fns";
import type { AgreementRecord, TransactionFile } from "@/types";

/** How many days before the end date the agent is warned. */
export const LISTING_WARNING_DAYS = 10;

/**
 * Statuses the agent ended on purpose, or that mean the house is still in a
 * deal. A lapsed listing agreement must not overwrite these.
 */
const PROTECTED: TransactionFile["status"][] = [
  "under_contract",
  "closed",
  "dropped",
  "terminated",
  "expired",
];

/** Statuses a listing may still be in when its agreement runs out. */
const OPENABLE: TransactionFile["status"][] = [
  "prospective",
  "listed",
  "buyer_agency",
  "in_progress",
];

function validDate(value: string | undefined): Date | null {
  if (!value) return null;
  const date = parseISO(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * The signed listing agreement that is in force.
 * A draft does not count. If the seller signed more than one, the latest end date is the current term.
 */
export function currentListingAgreement(file: TransactionFile): AgreementRecord | undefined {
  if (file.side !== "listing") return undefined;
  const signed = (file.agreements ?? []).filter(
    (a) => a.kind === "listing" && a.status === "executed" && validDate(a.termEnd)
  );
  if (signed.length === 0) return undefined;
  return signed.reduce((best, a) =>
    (validDate(a.termEnd) as Date) > (validDate(best.termEnd) as Date) ? a : best
  );
}

/** End date of the listing contract that is actually in force. */
export function listingTermEnd(file: TransactionFile): string | undefined {
  return currentListingAgreement(file)?.termEnd;
}

/**
 * A heads-up while the listing is still active and the end date is within 10 days.
 * Already expired, under contract, sold, dropped, and canceled files are skipped.
 */
export function listingExpiryWarning(
  file: TransactionFile,
  now = new Date()
): { termEnd: string; daysLeft: number } | null {
  if (!OPENABLE.includes(file.status)) return null;
  const end = listingTermEnd(file);
  if (!end) return null;
  const daysLeft = differenceInCalendarDays(parseISO(end), now);
  if (daysLeft < 0 || daysLeft > LISTING_WARNING_DAYS) return null;
  return { termEnd: end, daysLeft };
}

/** First day the agent is allowed to extend to: after the current end, and not in the past. */
export function earliestExtendDay(currentEnd: string, now = new Date()): Date {
  const dayAfterEnd = addDays(startOfDay(parseISO(currentEnd)), 1);
  const today = startOfDay(now);
  return dayAfterEnd > today ? dayAfterEnd : today;
}

/** Why a new end date cannot be saved, or null when it is a real extension. */
export function listingExtendError(currentEnd: string, nextEnd: string, now = new Date()): string | null {
  const next = validDate(nextEnd);
  const current = validDate(currentEnd);
  if (!next || !current) return "Enter the new end date.";
  if (differenceInCalendarDays(next, current) <= 0) {
    return `Pick a day after ${format(current, "MMM d, yyyy")}.`;
  }
  if (isDayAfterTerm(nextEnd, now)) {
    return "That day is already past. Pick today or a later day.";
  }
  return null;
}

export function toDateInput(value?: string): string {
  if (!value) return "";
  const date = parseISO(value);
  return Number.isNaN(date.getTime()) ? "" : format(date, "yyyy-MM-dd");
}

/** Noon local time, so the calendar day does not slip across midnight UTC. */
export function fromDateInput(value: string): string | undefined {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day, 12, 0, 0).toISOString();
}

/** True on the calendar day after `termEnd`, and every day after that. */
export function isDayAfterTerm(termEnd: string, now: Date): boolean {
  const end = validDate(termEnd);
  if (!end) return false;
  return differenceInCalendarDays(now, end) >= 1;
}

/**
 * The listing contract has ended and this file should move to Expired.
 * Buyers are ignored. Under contract, sold, dropped, and canceled files stay
 * as they are. The end date itself is still a valid day — expiry starts tomorrow.
 */
export function isListingTermOver(file: TransactionFile, now = new Date()): boolean {
  if (file.side !== "listing") return false;
  if (!OPENABLE.includes(file.status)) return false;
  if (PROTECTED.includes(file.status)) return false;
  const end = listingTermEnd(file);
  if (!end) return false;
  return isDayAfterTerm(end, now);
}
