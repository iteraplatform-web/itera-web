import { addDays } from "date-fns";
import type { ChecklistTask, TaskWorkTarget } from "@/types";

/* ────────────────────────────────────────────────────────────────────────
 * 1. Where each task gets done
 *
 * Every task names a concrete action and the exact place it happens, so the
 * checklist is never a list of things to go and find. `focus` opens and
 * highlights one specific document, email template, or control.
 * ──────────────────────────────────────────────────────────────────────── */

export const TASK_ACTIONS: Record<string, Partial<TaskWorkTarget>> = {
  crm_profile: { label: "Fill in the client profile" },
  welcome_packet: { label: "Send the welcome email", focus: "welcome" },
  buyer_agreement: { section: "documents", label: "Upload the signed agreement", focus: "Buyer Agency Agreement" },
  listing_agreement: { section: "documents", label: "Upload the signed agreement", focus: "Listing Agreement" },
  referral_agreement: { section: "documents", label: "Upload the referral agreement", focus: "Referral Agreement" },
  relocation_packet: { section: "documents", label: "Upload the authorization", focus: "Relocation Authorization" },
  buyer_preapproval: { section: "documents", label: "Upload the pre-approval letter", focus: "Pre-Approval Letter" },
  cma: { label: "Open the pricing worksheet" },
  lead_paint_disclosure: { label: "Upload the disclosure", focus: "Lead-Based Paint Disclosure" },
  property_prep: { label: "Open the prep list" },
  property_photos: { section: "photos", label: "Upload listing photos" },
  mls_entry: { label: "Open the listing sheet" },
  showing_instructions: { label: "Set showing instructions" },
  marketing_launch: { label: "Open the marketing plan" },
  property_search: { label: "Set the search criteria" },
  showings_buyer: { label: "Log a showing" },
  offer_review: { label: "Log and compare offers", focus: "offers" },
  submit_offer: { label: "Log the offer", focus: "offers" },
  executed_contract: { label: "Open documents" },
  earnest_money: { label: "Confirm earnest money", focus: "earnest" },
  earnest_money_buyer: { label: "Confirm earnest money", focus: "earnest" },
  inspection: { section: "communications", label: "Email the client about the inspection", focus: "inspection_notice" },
  inspection_buyer: { section: "documents", label: "Upload the inspection report", focus: "Inspection Report" },
  closing_data_sheet: { label: "Review the payout figures", focus: "commission" },
  closing: { section: "communications", label: "Send the closing reminder", focus: "closing_reminder" },
  closing_buyer: { section: "communications", label: "Send the closing reminder", focus: "closing_reminder" },
  post_close_followup: { section: "communications", label: "Send the thank-you email", focus: "post_close" },
  post_close_followup_buyer: { section: "communications", label: "Send the thank-you email", focus: "post_close" },
  file_archive: { label: "Check every document is in" },
};

export function withTaskAction(taskId: string, base?: TaskWorkTarget): TaskWorkTarget | undefined {
  const override = TASK_ACTIONS[taskId];
  if (!base && !override?.section) return undefined;
  return { ...(base as TaskWorkTarget), ...override } as TaskWorkTarget;
}

/* ────────────────────────────────────────────────────────────────────────
 * 2. Work done elsewhere ticks the checklist
 *
 * Uploading the signed listing agreement *is* filing the executed copy, so
 * the agent should not have to tick it twice. Each rule names the task and the
 * start of the step's wording it satisfies.
 * ──────────────────────────────────────────────────────────────────────── */

export interface AutomationRule {
  taskId: string;
  subtaskStartsWith: string;
}

export const ON_DOCUMENT_RECEIVED: Record<string, AutomationRule[]> = {
  "Listing Agreement": [{ taskId: "listing_agreement", subtaskStartsWith: "File the executed copy" }],
  "Buyer Agency Agreement": [{ taskId: "buyer_agreement", subtaskStartsWith: "File the executed copy" }],
  "Referral Agreement": [{ taskId: "referral_agreement", subtaskStartsWith: "Execute the referral agreement" }],
  "Relocation Authorization": [{ taskId: "relocation_packet", subtaskStartsWith: "Confirm written authorization" }],
  "Lead-Based Paint Disclosure": [{ taskId: "lead_paint_disclosure", subtaskStartsWith: "Have the seller complete" }],
  "Pre-Approval Letter": [{ taskId: "buyer_preapproval", subtaskStartsWith: "Collect the lender" }],
  "Earnest Money Receipt": [
    { taskId: "earnest_money", subtaskStartsWith: "Obtain the receipt" },
    { taskId: "earnest_money_buyer", subtaskStartsWith: "File the receipt" },
  ],
};

export const ON_EMAIL_SENT: Record<string, AutomationRule[]> = {
  welcome: [{ taskId: "welcome_packet", subtaskStartsWith: "Send the welcome email" }],
  inspection_notice: [{ taskId: "inspection", subtaskStartsWith: "Coordinate inspection access" }],
  closing_reminder: [
    { taskId: "closing", subtaskStartsWith: "Confirm the signing appointment" },
    { taskId: "closing_buyer", subtaskStartsWith: "Review the closing disclosure" },
  ],
  post_close: [
    { taskId: "post_close_followup", subtaskStartsWith: "Send the thank-you note" },
    { taskId: "post_close_followup", subtaskStartsWith: "Request an online review" },
    { taskId: "post_close_followup_buyer", subtaskStartsWith: "Send the thank-you note" },
    { taskId: "post_close_followup_buyer", subtaskStartsWith: "Request an online review" },
  ],
};

export const ON_PHOTOS_ADDED: AutomationRule[] = [
  { taskId: "property_photos", subtaskStartsWith: "Review and select the final images" },
];

export const ON_OFFER_LOGGED: AutomationRule[] = [
  { taskId: "offer_review", subtaskStartsWith: "Log each offer" },
  { taskId: "submit_offer", subtaskStartsWith: "Submit the offer" },
];

/** Accepting an offer concludes the review: every step of it is, by then, done. */
export const ON_OFFER_ACCEPTED: AutomationRule[] = [
  { taskId: "offer_review", subtaskStartsWith: "Log each offer" },
  { taskId: "offer_review", subtaskStartsWith: "Verify proof of funds" },
  { taskId: "offer_review", subtaskStartsWith: "Present a side-by-side" },
  { taskId: "offer_review", subtaskStartsWith: "Deliver the seller" },
  { taskId: "submit_offer", subtaskStartsWith: "Agree price" },
  { taskId: "submit_offer", subtaskStartsWith: "Attach the pre-approval" },
  { taskId: "submit_offer", subtaskStartsWith: "Submit the offer" },
];

export const ON_EARNEST_RECEIVED: AutomationRule[] = [
  { taskId: "earnest_money", subtaskStartsWith: "Confirm the deposit arrived" },
  { taskId: "earnest_money_buyer", subtaskStartsWith: "Confirm delivery" },
];

/**
 * Applies rules to a checklist in place. Returns the titles of the steps it
 * ticked, so the caller can log them and tell the agent.
 */
export function applyAutomation(checklist: ChecklistTask[], rules: AutomationRule[]): string[] {
  const ticked: string[] = [];
  for (const rule of rules) {
    const task = checklist.find((t) => t.id === rule.taskId);
    if (!task || task.status === "completed") continue;
    const sub = task.subtasks.find((s) => s.title.startsWith(rule.subtaskStartsWith));
    if (!sub || sub.completed) continue;
    sub.completed = true;
    ticked.push(`${task.title} — ${sub.title}`);
  }
  return ticked;
}

/* ────────────────────────────────────────────────────────────────────────
 * 3. Deadlines follow the contract
 *
 * Once a contract is signed, the dates that matter are fixed by the contract
 * and the closing date — not by when the file was opened. These offsets are
 * a typical residential timeline: option period and earnest money run from
 * the contract date; appraisal, financing, and walkthrough count back from
 * closing. Change the closing date and every dependent deadline moves with it.
 * ──────────────────────────────────────────────────────────────────────── */

export const FROM_CONTRACT: Record<string, number> = {
  executed_contract: 1,
  earnest_money: 3,
  earnest_money_buyer: 3,
  inspection: 5,
  inspection_buyer: 7,
  title_search: 5,
  title_review_buyer: 10,
};

export const FROM_CLOSING: Record<string, number> = {
  appraisal: -21,
  appraisal_buyer: -21,
  financing_contingency: -10,
  financing_buyer: -10,
  insurance_buyer: -7,
  closing_data_sheet: -5,
  utilities_transfer: -4,
  final_walkthrough: -2,
  final_walkthrough_buyer: -2,
  closing: 0,
  closing_buyer: 0,
  post_close_followup: 5,
  post_close_followup_buyer: 5,
  file_archive: 10,
};

/** Re-dates outstanding tasks in place. Returns how many moved. */
export function rescheduleChecklist(
  checklist: ChecklistTask[],
  anchors: { contractDate?: string; closingDate?: string }
): number {
  let moved = 0;
  for (const task of checklist) {
    if (task.status === "completed") continue;
    let next: Date | undefined;
    if (anchors.contractDate && task.id in FROM_CONTRACT) {
      next = addDays(new Date(anchors.contractDate), FROM_CONTRACT[task.id]);
    } else if (anchors.closingDate && task.id in FROM_CLOSING) {
      next = addDays(new Date(anchors.closingDate), FROM_CLOSING[task.id]);
    }
    if (next && next.toISOString() !== task.dueDate) {
      task.dueDate = next.toISOString();
      moved += 1;
    }
  }
  return moved;
}

/* ────────────────────────────────────────────────────────────────────────
 * 4. Files that arrive mid-transaction
 *
 * A spreadsheet row marked "Under Contract" has, by definition, already been
 * through intake, prep, marketing, and offers. Those phases are marked done
 * (and labelled as done before ITERA) so the checklist starts where the deal
 * actually is.
 * ──────────────────────────────────────────────────────────────────────── */

const PHASES_DONE_BY_STATUS: Record<string, ChecklistTask["phase"][]> = {
  prospective: [],
  buyer_agency: [],
  listed: ["intake", "listing_prep"],
  in_progress: ["intake"],
  under_contract: ["intake", "listing_prep", "marketing", "offers"],
  closed: ["intake", "listing_prep", "marketing", "offers", "under_contract", "closing", "post_close"],
  dropped: [],
  terminated: ["intake", "listing_prep", "marketing", "offers"],
};

export function advanceChecklistToStatus(checklist: ChecklistTask[], status: string, when: string): number {
  const phases = new Set(PHASES_DONE_BY_STATUS[status] ?? []);
  let n = 0;
  for (const task of checklist) {
    if (!phases.has(task.phase) || task.status === "completed") continue;
    task.status = "completed";
    task.completedAt = when;
    task.completedBy = "Before ITERA";
    task.subtasks = task.subtasks.map((s) => ({ ...s, completed: true }));
    n++;
  }
  return n;
}
