import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { listingTermEnd } from "@/lib/work/listing-expiry";
import type { TransactionFile } from "@/types";

/** A date this close, or closer, is urgent. Same window as a listing-end warning. */
const URGENT_WITHIN_DAYS = 10;

export type DeadlineTone = "late" | "urgent" | "normal" | "none";

export const DEADLINE_KEY: {
  tone: DeadlineTone;
  label: string;
  hint: string;
  solid: string;
}[] = [
  {
    tone: "late",
    label: "Late",
    hint: "The closing date or the listing end date has already passed, and this file is still open.",
    solid: "bg-[#f04438]",
  },
  {
    tone: "urgent",
    label: "Urgent",
    hint: "The closing date or the listing end date is today, or within the next 10 days.",
    solid: "bg-[#e25a00]",
  },
  {
    tone: "normal",
    label: "Normal",
    hint: "The closing date or the listing end date is more than 10 days away, so there is still time.",
    solid: "bg-[#22c55e]",
  },
  {
    tone: "none",
    label: "No date",
    hint: "No closing date and no listing end date has been set on this file yet.",
    solid: "bg-[#3a3a38]",
  },
];

type DateKind = "closing" | "listing" | "buyer";

function buyerTermEnd(file: TransactionFile): string | undefined {
  if (file.side !== "buying") return undefined;
  const signed = (file.agreements ?? []).filter(
    (agreement) => agreement.kind === "buyer" && agreement.status === "executed" && agreement.termEnd
  );
  if (signed.length === 0) return undefined;
  return signed.reduce((best, agreement) => ((agreement.termEnd ?? "") > (best.termEnd ?? "") ? agreement : best)).termEnd;
}

/**
 * The date that decides the dot.
 * A file under contract or already closed is judged by its closing date.
 * A listing that is still for sale is judged by the day the listing agreement ends.
 */
function pickDate(file: TransactionFile): { kind: DateKind; iso: string } | null {
  const closing = file.closingDate;
  const listing = listingTermEnd(file);
  const buyer = buyerTermEnd(file);

  if ((file.status === "under_contract" || file.status === "closed") && closing) {
    return { kind: "closing", iso: closing };
  }
  if (listing) return { kind: "listing", iso: listing };
  if (closing) return { kind: "closing", iso: closing };
  if (buyer) return { kind: "buyer", iso: buyer };
  return null;
}

function whenLabel(kind: DateKind, iso: string, days: number): string {
  const day = format(parseISO(iso), "MMM d");
  if (days === 0) {
    if (kind === "closing") return "Closes today";
    if (kind === "listing") return "Listing ends today";
    return "Agreement ends today";
  }
  if (days < 0) {
    if (kind === "closing") return `Closing was ${day}`;
    if (kind === "listing") return `Listing ended ${day}`;
    return `Agreement ended ${day}`;
  }
  if (kind === "closing") return `Closes ${day}`;
  if (kind === "listing") return `Listing ends ${day}`;
  return `Agreement ends ${day}`;
}

/** How pressing the closing date or the listing end date is. */
export function fileDeadline(file: TransactionFile): {
  tone: DeadlineTone;
  label: string;
  detail: string;
} {
  if (file.status === "dropped" || file.status === "terminated") {
    return { tone: "none", label: "No date", detail: "No active deadline" };
  }

  const picked = pickDate(file);
  if (!picked) {
    return { tone: "none", label: "No date", detail: "No closing or end date" };
  }

  const days = differenceInCalendarDays(parseISO(picked.iso), new Date());

  if (file.status === "closed") {
    return { tone: "normal", label: "Normal", detail: whenLabel(picked.kind, picked.iso, -1) };
  }

  if (days < 0) {
    return { tone: "late", label: "Late", detail: whenLabel(picked.kind, picked.iso, days) };
  }
  if (days <= URGENT_WITHIN_DAYS) {
    return { tone: "urgent", label: "Urgent", detail: whenLabel(picked.kind, picked.iso, days) };
  }
  return { tone: "normal", label: "Normal", detail: whenLabel(picked.kind, picked.iso, days) };
}

const TONE_ORDER: Record<DeadlineTone, number> = {
  late: 0,
  urgent: 1,
  normal: 2,
  none: 3,
};

/** Late first, then urgent, then normal, then no date. */
export function compareByDeadline(a: TransactionFile, b: TransactionFile): number {
  const tone = TONE_ORDER[fileDeadline(a).tone] - TONE_ORDER[fileDeadline(b).tone];
  if (tone !== 0) return tone;
  return a.clientName.localeCompare(b.clientName);
}
