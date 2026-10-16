import type { TransactionStatus } from "@/types";

/**
 * Statuses the agent may pick by hand.
 * Listed, Buyer Agency, Under Contract, and Expired are set by the deal, not this menu.
 */
export function manualStatusChoices(status: TransactionStatus): TransactionStatus[] {
  switch (status) {
    case "prospective":
    case "listed":
    case "buyer_agency":
    case "in_progress":
    case "expired":
      return ["dropped"];
    case "under_contract":
      return ["closed", "terminated"];
    default:
      return [];
  }
}

export function statusChangeHint(status: TransactionStatus): string {
  switch (status) {
    case "prospective":
      return "Sign the agreement to move this file forward. Dropped is the only status you pick here.";
    case "listed":
    case "buyer_agency":
    case "in_progress":
      return "Accept an offer to go Under Contract. A listing expires on its own the day after the agreement ends.";
    case "under_contract":
      return "Mark Closed when the sale is done, or Terminated if the contract falls through.";
    case "expired":
      return "Extend the agreement to become Listed again, or mark Dropped.";
    case "closed":
      return "This file is closed. The status stays here.";
    case "dropped":
      return "This file was dropped. The status stays here.";
    case "terminated":
      return "This contract was terminated. The status stays here.";
  }
}

/** Why a hand-picked status is not allowed. Null means the change is ok. */
export function manualStatusError(from: TransactionStatus, to: TransactionStatus): string | null {
  if (from === to || manualStatusChoices(from).includes(to)) return null;
  if (to === "expired") return "A listing becomes Expired the day after the agreement ends.";
  if (to === "under_contract") return "Accept an offer on the Money page to go Under Contract.";
  if (to === "listed") return "Mark the listing agreement executed to become Listed. If it expired, use Extend.";
  if (to === "buyer_agency") return "Mark the buyer agreement executed to become Buyer Agency.";
  if (to === "closed") return "Only a file Under Contract can be marked Closed.";
  if (to === "terminated") return "Terminated is only for a contract that falls through.";
  if (to === "dropped") return "This file can no longer be dropped.";
  if (to === "prospective" || to === "in_progress") return "That status is not chosen by hand.";
  return "That status does not follow from where this file is.";
}
