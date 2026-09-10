import { v4 as uuid } from "uuid";
import { addDays, format } from "date-fns";
import { createDefaultWorkFields } from "@/lib/work/defaults";
import { withTaskAction } from "@/lib/checklist/rules";
import type {
  ChecklistPhase,
  ChecklistTask,
  ChecklistTemplateRule,
  Document,
  EmailTemplate,
  IntakeAnswers,
  Subtask,
  TaskStatus,
  TaskWorkTarget,
  TransactionFile,
  TransactionSide,
} from "@/types";

interface TaskTemplate {
  id: string;
  title: string;
  description: string;
  phase: ChecklistPhase;
  dependsOn: string[];
  subtasks?: string[];
  conditions?: {
    side?: TransactionSide;
    isReferral?: boolean;
    isRelocation?: boolean;
    builtBefore1978?: boolean;
  };
  addedBecause?: string;
  daysFromStart?: number;
  workTarget?: TaskWorkTarget;
}

const BASE_TASKS: TaskTemplate[] = [
  /* ── Intake ─────────────────────────────────────────────────────────── */
  {
    id: "crm_profile",
    title: "Complete Client Profile",
    description: "Record client details and relationship history in ITERA",
    phase: "intake",
    dependsOn: [],
    subtasks: [
      "Record the client's name, phone, email, and address",
      "Note how the relationship started — where you met, what was discussed",
      "Record their real estate goals and timeline",
      "Set preferred contact method and best time to reach them",
    ],
    daysFromStart: 1,
    workTarget: { section: "client_profile" },
  },
  {
    id: "welcome_packet",
    title: "Send Welcome Packet",
    description: "Introduce the process and set expectations up front",
    phase: "intake",
    dependsOn: ["crm_profile"],
    subtasks: [
      "Send the welcome email with the process overview",
      "Share the client portal link so they can follow along",
      "Confirm they received it and answer first questions",
    ],
    daysFromStart: 2,
    workTarget: { section: "communications" },
  },
  {
    id: "buyer_agreement",
    title: "Execute Buyer Agency Agreement",
    description: "Signed buyer representation agreement on file",
    phase: "intake",
    dependsOn: ["crm_profile"],
    conditions: { side: "buying" },
    subtasks: [
      "Review agency duties and compensation with the client",
      "Send the agreement for signature",
      "File the executed copy and log the effective dates",
    ],
    daysFromStart: 3,
    workTarget: { section: "milestones" },
  },
  {
    id: "listing_agreement",
    title: "Execute Listing Agreement",
    description: "Signed listing agreement on file",
    phase: "intake",
    dependsOn: ["crm_profile"],
    conditions: { side: "listing" },
    subtasks: [
      "Confirm list price, term, and commission with the seller",
      "Review seller disclosures and obligations",
      "Send the agreement for signature",
      "File the executed copy and log the expiration date",
    ],
    daysFromStart: 3,
    workTarget: { section: "milestones" },
  },
  {
    id: "referral_agreement",
    title: "Obtain Referral Agreement",
    description: "Signed referral agreement documenting the fee split",
    phase: "intake",
    dependsOn: ["crm_profile"],
    conditions: { isReferral: true },
    addedBecause: "File flagged as a referral",
    subtasks: [
      "Confirm the referral percentage with the referring broker",
      "Execute the referral agreement between brokerages",
      "Record the fee split so it is deducted at closing",
    ],
    daysFromStart: 5,
    workTarget: { section: "milestones" },
  },
  {
    id: "relocation_packet",
    title: "Submit Relocation Authorization",
    description: "Corporate relocation paperwork submitted and approved",
    phase: "intake",
    dependsOn: ["crm_profile"],
    conditions: { isRelocation: true },
    addedBecause: "File flagged as a relocation",
    subtasks: [
      "Register the file with the relocation company",
      "Submit the broker market analysis on their form",
      "Confirm written authorization to proceed before listing",
    ],
    daysFromStart: 5,
    workTarget: { section: "milestones" },
  },
  {
    id: "buyer_preapproval",
    title: "Confirm Buyer Pre-Approval",
    description: "Lender pre-approval letter on file",
    phase: "intake",
    dependsOn: ["buyer_agreement"],
    conditions: { side: "buying" },
    subtasks: [
      "Collect the lender's pre-approval letter",
      "Verify the approved amount covers the search range",
      "Note the letter's expiration date for renewal",
    ],
    daysFromStart: 7,
    workTarget: { section: "milestones" },
  },

  /* ── Listing prep ───────────────────────────────────────────────────── */
  {
    id: "cma",
    title: "Complete Comparative Market Analysis",
    description: "Price the property against recent comparable sales",
    phase: "listing_prep",
    dependsOn: ["listing_agreement"],
    conditions: { side: "listing" },
    subtasks: [
      "Pull comparable sales from the last six months",
      "Adjust for condition, lot, and square footage",
      "Present the pricing recommendation to the seller",
    ],
    daysFromStart: 5,
    workTarget: { section: "pricing", route: "pricing" },
  },
  {
    id: "lead_paint_disclosure",
    title: "Prepare Lead-Based Paint Disclosure",
    description: "Federally required for properties built before 1978",
    phase: "listing_prep",
    dependsOn: ["listing_agreement"],
    conditions: { side: "listing", builtBefore1978: true },
    addedBecause: "Property built before 1978",
    subtasks: [
      "Have the seller complete the lead-based paint disclosure",
      "Attach the EPA pamphlet to the disclosure packet",
      "Confirm the 10-day inspection window language is included",
    ],
    daysFromStart: 7,
    workTarget: { section: "documents" },
  },
  {
    id: "property_prep",
    title: "Prepare Property for Market",
    description: "Staging, repairs, and curb appeal ahead of photography",
    phase: "listing_prep",
    dependsOn: ["listing_agreement"],
    conditions: { side: "listing" },
    subtasks: [
      "Walk the property and list recommended repairs",
      "Agree the staging plan with the seller",
      "Confirm the property is photo-ready",
    ],
    daysFromStart: 6,
    workTarget: { section: "property_work" },
  },
  {
    id: "property_photos",
    title: "Schedule Professional Photography",
    description: "High-quality photos for marketing materials",
    phase: "listing_prep",
    dependsOn: ["property_prep"],
    conditions: { side: "listing" },
    subtasks: [
      "Book the photographer and confirm access",
      "Confirm the shot list including twilight and drone",
      "Review and select the final images",
    ],
    daysFromStart: 8,
    workTarget: { section: "property_work" },
  },

  /* ── Marketing ──────────────────────────────────────────────────────── */
  {
    id: "mls_entry",
    title: "Enter Listing in MLS",
    description: "Full listing sheet with accurate property details (system of record)",
    phase: "marketing",
    dependsOn: ["property_photos"],
    conditions: { side: "listing" },
    subtasks: [
      "Enter property details, room dimensions, and features",
      "Upload photos and write the public remarks",
      "Attach disclosures to the listing",
      "Proof the entry against county records before publishing",
    ],
    daysFromStart: 10,
    workTarget: { section: "listing_details", route: "listing" },
  },
  {
    id: "showing_instructions",
    title: "Set Up Showing Instructions",
    description: "Access windows, lockbox, and showing rules on file",
    phase: "marketing",
    dependsOn: ["mls_entry"],
    conditions: { side: "listing" },
    subtasks: [
      "Install the lockbox and record the code",
      "Set showing windows and notice requirements",
      "Confirm pet and alarm instructions with the seller",
    ],
    daysFromStart: 12,
    workTarget: { section: "showings" },
  },
  {
    id: "marketing_launch",
    title: "Launch Marketing Campaign",
    description: "Syndication, social, and the first open house",
    phase: "marketing",
    dependsOn: ["mls_entry"],
    conditions: { side: "listing" },
    subtasks: [
      "Confirm syndication to the major portals",
      "Publish the social and email announcement",
      "Schedule the first open house",
    ],
    daysFromStart: 13,
    workTarget: { section: "marketing" },
  },
  {
    id: "property_search",
    title: "Set Up Property Search Alerts",
    description: "Search criteria and alerts configured for the buyer",
    phase: "marketing",
    dependsOn: ["buyer_preapproval"],
    conditions: { side: "buying" },
    subtasks: [
      "Configure the search criteria in the MLS",
      "Turn on instant alerts to the client",
      "Review the first results together and refine",
    ],
    daysFromStart: 10,
    workTarget: { section: "marketing" },
  },
  {
    id: "showings_buyer",
    title: "Schedule and Conduct Showings",
    description: "Tour shortlisted properties with the buyer",
    phase: "marketing",
    dependsOn: ["property_search"],
    conditions: { side: "buying" },
    subtasks: [
      "Shortlist properties with the client",
      "Book showing appointments",
      "Record feedback on each property after the tour",
    ],
    daysFromStart: 14,
    workTarget: { section: "showings" },
  },

  /* ── Offers ─────────────────────────────────────────────────────────── */
  {
    id: "offer_review",
    title: "Review Incoming Offers",
    description: "Evaluate and respond to every offer received",
    phase: "offers",
    dependsOn: ["showing_instructions"],
    conditions: { side: "listing" },
    subtasks: [
      "Log each offer with price, financing, and contingencies",
      "Verify proof of funds or pre-approval for each buyer",
      "Present a side-by-side comparison to the seller",
      "Deliver the seller's response to each buyer's agent",
    ],
    daysFromStart: 20,
    workTarget: { section: "financials" },
  },
  {
    id: "submit_offer",
    title: "Prepare and Submit Offer",
    description: "Offer package prepared and submitted to the seller",
    phase: "offers",
    dependsOn: ["showings_buyer"],
    conditions: { side: "buying" },
    subtasks: [
      "Agree price, terms, and contingencies with the buyer",
      "Attach the pre-approval or proof of funds",
      "Submit the offer and confirm receipt",
    ],
    daysFromStart: 20,
    workTarget: { section: "financials" },
  },
  {
    id: "executed_contract",
    title: "Distribute Executed Contract",
    description: "Fully signed contract circulated to all parties",
    phase: "offers",
    dependsOn: ["offer_review"],
    conditions: { side: "listing" },
    subtasks: [
      "Confirm every page is initialled and signed",
      "Send the executed contract to title and the lender",
      "Calendar every contract deadline",
    ],
    daysFromStart: 22,
    workTarget: { section: "documents" },
  },

  /* ── Under contract ─────────────────────────────────────────────────── */
  {
    id: "earnest_money",
    title: "Confirm Earnest Money Received",
    description: "Earnest money deposit verified in escrow",
    phase: "under_contract",
    dependsOn: ["executed_contract"],
    conditions: { side: "listing" },
    subtasks: [
      "Confirm the deposit arrived within the contract deadline",
      "Obtain the receipt from the title company",
      "File the receipt and notify the seller",
    ],
    daysFromStart: 25,
    workTarget: { section: "financials" },
  },
  {
    id: "earnest_money_buyer",
    title: "Deliver Earnest Money",
    description: "Earnest money delivered to the title company",
    phase: "under_contract",
    dependsOn: ["submit_offer"],
    conditions: { side: "buying" },
    subtasks: [
      "Send the buyer the wire instructions and fraud warning",
      "Confirm delivery before the contract deadline",
      "File the receipt",
    ],
    daysFromStart: 25,
    workTarget: { section: "financials" },
  },
  {
    id: "title_search",
    title: "Initiate Title Search",
    description: "Title company begins the title commitment process",
    phase: "under_contract",
    dependsOn: ["earnest_money"],
    conditions: { side: "listing" },
    subtasks: [
      "Open title and send the contract to the title company",
      "Review the title commitment for exceptions",
      "Clear any liens or clouds found on title",
    ],
    daysFromStart: 30,
    workTarget: { section: "milestones" },
  },
  {
    id: "inspection",
    title: "Schedule Home Inspection",
    description: "Inspection ordered within the contract deadline",
    phase: "under_contract",
    dependsOn: ["earnest_money"],
    conditions: { side: "listing" },
    subtasks: [
      "Coordinate inspection access with the seller",
      "Confirm the inspection happens inside the option period",
      "Review the report and negotiate repairs",
      "Document the agreed repair amendment",
    ],
    daysFromStart: 28,
    workTarget: { section: "milestones" },
  },
  {
    id: "inspection_buyer",
    title: "Complete Home Inspection",
    description: "Inspection completed and results reviewed",
    phase: "under_contract",
    dependsOn: ["earnest_money_buyer"],
    conditions: { side: "buying" },
    subtasks: [
      "Book the inspector inside the option period",
      "Attend the inspection walkthrough with the buyer",
      "Submit the repair request before the deadline",
    ],
    daysFromStart: 28,
    workTarget: { section: "milestones" },
  },
  {
    id: "appraisal",
    title: "Order Appraisal",
    description: "Appraisal ordered per lender requirements",
    phase: "under_contract",
    dependsOn: ["inspection"],
    conditions: { side: "listing" },
    subtasks: [
      "Confirm the lender has ordered the appraisal",
      "Provide the appraiser with access and comparables",
      "Review the appraised value against the contract price",
    ],
    daysFromStart: 32,
    workTarget: { section: "milestones" },
  },
  {
    id: "financing_contingency",
    title: "Clear Financing Contingency",
    description: "Loan approval confirmed before the contingency expires",
    phase: "under_contract",
    dependsOn: ["appraisal"],
    conditions: { side: "listing" },
    subtasks: [
      "Confirm the loan is through underwriting",
      "Obtain written clear-to-close from the lender",
      "Release the financing contingency in writing",
    ],
    daysFromStart: 36,
    workTarget: { section: "milestones" },
  },

  /* ── Closing ────────────────────────────────────────────────────────── */
  {
    id: "closing_data_sheet",
    title: "Prepare Closing Data Sheet",
    description: "All closing details compiled for the title company",
    phase: "closing",
    dependsOn: ["earnest_money", "title_search"],
    conditions: { side: "listing" },
    subtasks: [
      "Compile commission splits and referral fees",
      "Confirm payoff figures and prorations",
      "Send the data sheet to the title company",
    ],
    daysFromStart: 40,
    workTarget: { section: "financials" },
  },
  {
    id: "utilities_transfer",
    title: "Coordinate Utility Transfer",
    description: "Services switched over on the closing date",
    phase: "closing",
    dependsOn: ["closing_data_sheet"],
    conditions: { side: "listing" },
    subtasks: [
      "Send the utility provider list to both parties",
      "Confirm the transfer date matches closing",
    ],
    daysFromStart: 41,
    workTarget: { section: "milestones" },
  },
  {
    id: "final_walkthrough",
    title: "Schedule Final Walkthrough",
    description: "Pre-closing walkthrough with the buyer",
    phase: "closing",
    dependsOn: ["closing_data_sheet"],
    conditions: { side: "listing" },
    subtasks: [
      "Book the walkthrough within 48 hours of closing",
      "Verify agreed repairs are complete",
      "Confirm the property is in the contracted condition",
    ],
    daysFromStart: 42,
    workTarget: { section: "milestones" },
  },
  {
    id: "closing",
    title: "Attend Closing",
    description: "Closing completed and keys transferred",
    phase: "closing",
    dependsOn: ["final_walkthrough"],
    conditions: { side: "listing" },
    subtasks: [
      "Review the closing disclosure for errors",
      "Confirm the signing appointment with all parties",
      "Hand over keys, remotes, and access codes",
      "Confirm funding and recording",
    ],
    daysFromStart: 45,
    workTarget: { section: "milestones" },
  },
  {
    id: "appraisal_buyer",
    title: "Track Appraisal",
    description: "Lender appraisal ordered and reviewed",
    phase: "under_contract",
    dependsOn: ["inspection_buyer"],
    conditions: { side: "buying" },
    subtasks: [
      "Confirm the lender ordered the appraisal",
      "Review the appraised value against the contract price",
      "Advise the buyer if an appraisal gap needs covering",
    ],
    daysFromStart: 32,
    workTarget: { section: "milestones" },
  },
  {
    id: "title_review_buyer",
    title: "Review Title Commitment",
    description: "Title commitment reviewed for exceptions",
    phase: "under_contract",
    dependsOn: ["earnest_money_buyer"],
    conditions: { side: "buying" },
    subtasks: [
      "Receive the title commitment from the title company",
      "Review exceptions and easements with the buyer",
      "Confirm the survey matches the legal description",
    ],
    daysFromStart: 30,
    workTarget: { section: "milestones" },
  },
  {
    id: "financing_buyer",
    title: "Confirm Clear to Close",
    description: "Loan approval received before the contingency expires",
    phase: "under_contract",
    dependsOn: ["appraisal_buyer"],
    conditions: { side: "buying" },
    subtasks: [
      "Confirm the file is through underwriting",
      "Obtain written clear-to-close from the lender",
      "Send the buyer the cash-to-close figure",
    ],
    daysFromStart: 36,
    workTarget: { section: "milestones" },
  },
  {
    id: "insurance_buyer",
    title: "Arrange Homeowners Insurance",
    description: "Policy bound and delivered to the lender",
    phase: "closing",
    dependsOn: ["financing_buyer"],
    conditions: { side: "buying" },
    subtasks: [
      "Collect quotes and confirm the buyer has chosen a policy",
      "Send the binder to the lender before closing",
    ],
    daysFromStart: 40,
    workTarget: { section: "milestones" },
  },
  {
    id: "final_walkthrough_buyer",
    title: "Conduct Final Walkthrough",
    description: "Pre-closing walkthrough with the buyer",
    phase: "closing",
    dependsOn: ["financing_buyer"],
    conditions: { side: "buying" },
    subtasks: [
      "Book the walkthrough within 48 hours of closing",
      "Verify agreed repairs are complete",
      "Confirm the property is in the contracted condition",
    ],
    daysFromStart: 42,
    workTarget: { section: "milestones" },
  },
  {
    id: "closing_buyer",
    title: "Attend Closing",
    description: "Closing completed and keys received",
    phase: "closing",
    dependsOn: ["final_walkthrough_buyer"],
    conditions: { side: "buying" },
    subtasks: [
      "Review the closing disclosure with the buyer",
      "Confirm the cash-to-close wire was sent",
      "Collect keys and access codes at signing",
    ],
    daysFromStart: 45,
    workTarget: { section: "milestones" },
  },
  {
    id: "post_close_followup_buyer",
    title: "Post-Close Follow Up",
    description: "Close the loop and ask for a review",
    phase: "post_close",
    dependsOn: ["closing_buyer"],
    conditions: { side: "buying" },
    subtasks: [
      "Send the thank-you note and closing gift",
      "Request an online review",
      "Add the client to the annual follow-up list",
    ],
    daysFromStart: 50,
    workTarget: { section: "milestones" },
  },

  /* ── Post close ─────────────────────────────────────────────────────── */
  {
    id: "post_close_followup",
    title: "Post-Close Follow Up",
    description: "Close the loop and ask for a review",
    phase: "post_close",
    dependsOn: ["closing"],
    conditions: { side: "listing" },
    subtasks: [
      "Send the thank-you note and closing gift",
      "Request an online review",
      "Add the client to the annual follow-up list",
    ],
    daysFromStart: 50,
    workTarget: { section: "milestones" },
  },
  {
    id: "file_archive",
    title: "Archive the Transaction File",
    description: "Complete file submitted for broker compliance review",
    phase: "post_close",
    dependsOn: ["closing"],
    conditions: { side: "listing" },
    subtasks: [
      "Verify every required document is on file",
      "Submit the file for broker review",
      "Record the commission received",
    ],
    daysFromStart: 55,
    workTarget: { section: "documents" },
  },
];

function matchesConditions(
  template: TaskTemplate,
  answers: IntakeAnswers
): boolean {
  if (!template.conditions) return true;
  const c = template.conditions;
  if (c.side !== undefined && c.side !== answers.side) return false;
  if (c.isReferral !== undefined && c.isReferral !== answers.isReferral) return false;
  if (c.isRelocation !== undefined && c.isRelocation !== answers.isRelocation) return false;
  if (c.builtBefore1978 !== undefined && c.builtBefore1978 !== answers.builtBefore1978) return false;
  return true;
}

function createSubtasks(titles: string[]): Subtask[] {
  return titles.map((title) => ({ id: uuid(), title, completed: false }));
}

export function generateChecklist(answers: IntakeAnswers, startDate = new Date()): ChecklistTask[] {
  const applicable = BASE_TASKS.filter((t) => matchesConditions(t, answers));
  const taskIds = new Set(applicable.map((t) => t.id));

  return applicable.map((template) => {
    const validDeps = template.dependsOn.filter((dep) => taskIds.has(dep));
    const dueDate = template.daysFromStart
      ? addDays(startDate, template.daysFromStart).toISOString()
      : undefined;

    return {
      id: template.id,
      title: template.title,
      description: template.description,
      phase: template.phase,
      status: "not_started" as const,
      dependsOn: validDeps,
      subtasks: template.subtasks ? createSubtasks(template.subtasks) : [],
      dueDate,
      addedBecause: template.addedBecause,
      workTarget: withTaskAction(template.id, template.workTarget),
    };
  });
}

export function resolveTaskStatus(
  task: ChecklistTask,
  allTasks: ChecklistTask[]
): TaskStatus {
  if (task.status === "completed") return "completed";

  const incompleteDeps = task.dependsOn.some((depId) => {
    const dep = allTasks.find((t) => t.id === depId);
    return dep && dep.status !== "completed";
  });

  if (incompleteDeps) return "blocked";
  if (task.subtasks.length > 0) {
    const allDone = task.subtasks.every((s) => s.completed);
    const someDone = task.subtasks.some((s) => s.completed);
    if (allDone) return "completed";
    if (someDone) return "in_progress";
  }
  return task.status === "in_progress" ? "in_progress" : "not_started";
}

/**
 * Turns a property address and a document name into the file-naming pattern the
 * brokerage already uses today, so nothing new has to be learned:
 *   1842-Oakwood-Dr_Lead-Paint-Disclosure_2026-09-08.pdf
 */
export function buildDocumentFileName(
  propertyAddress: string,
  docName: string,
  date: Date = new Date()
): string {
  const street = (propertyAddress.split(",")[0] || "File")
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 4)
    .join("-");
  const doc = docName.replace(/[^a-zA-Z0-9 ]/g, "").trim().replace(/\s+/g, "-");
  return `${street || "File"}_${doc}_${format(date, "yyyy-MM-dd")}.pdf`;
}

interface DocTemplate {
  name: string;
  category: Document["category"];
  expectedFrom: string;
}

/**
 * What a file's documents are named after: the street for listings, the
 * client for buyers — a buyer's "address" is only search criteria until they
 * are under contract.
 */
export function fileNameBase(f: { side: TransactionSide; propertyAddress: string; clientName: string }): string {
  if (f.side === "listing") return f.propertyAddress;
  const surname = f.clientName.replace(/&.*$/, "").trim().split(/\s+/).pop() ?? f.clientName;
  return `${surname} Buyer`;
}

export function generateDocuments(answers: IntakeAnswers): Document[] {
  const templates: DocTemplate[] = [
    { name: "Agency Disclosure", category: "disclosures", expectedFrom: "Client" },
    { name: "Property Condition Disclosure", category: "disclosures", expectedFrom: "Client" },
  ];

  if (answers.side === "listing") {
    templates.push(
      { name: "Listing Agreement", category: "disclosures", expectedFrom: "Client" },
      { name: "HOA Documents", category: "hoa", expectedFrom: "HOA Management" },
      { name: "HOA Resale Certificate", category: "hoa", expectedFrom: "HOA Management" },
      { name: "Permit History", category: "permits", expectedFrom: "County Records" },
      { name: "Survey", category: "permits", expectedFrom: "Title Company" }
    );
    if (answers.builtBefore1978) {
      templates.push({
        name: "Lead-Based Paint Disclosure",
        category: "disclosures",
        expectedFrom: "Client",
      });
    }
  } else {
    templates.push(
      { name: "Buyer Agency Agreement", category: "disclosures", expectedFrom: "Client" },
      { name: "Pre-Approval Letter", category: "disclosures", expectedFrom: "Lender" }
    );
  }

  if (answers.isReferral) {
    templates.push({
      name: "Referral Agreement",
      category: "disclosures",
      expectedFrom: "Referring Broker",
    });
  }

  if (answers.isRelocation) {
    templates.push({
      name: "Relocation Authorization",
      category: "disclosures",
      expectedFrom: "Relocation Company",
    });
  }

  templates.push(
    { name: "Earnest Money Receipt", category: "receipts", expectedFrom: "Title Company" },
    { name: "Inspection Report", category: "receipts", expectedFrom: "Inspector" },
    { name: "Closing Disclosure", category: "closing", expectedFrom: "Title Company" },
    { name: "Closing Statement", category: "closing", expectedFrom: "Title Company" }
  );

  return templates.map((t) => ({
    id: uuid(),
    name: t.name,
    fileName: buildDocumentFileName(fileNameBase(answers), t.name),
    category: t.category,
    status: "needed" as const,
    expectedFrom: t.expectedFrom,
  }));
}

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "welcome",
    name: "Welcome & Introduction",
    subject: "Welcome — let's get started on {{propertyAddress}}",
    body: `Hi {{clientName}},

Thank you for choosing to work with me on {{propertyAddress}}. I wanted to lay out what happens next so nothing catches you by surprise.

Over the next few days I'll be preparing the paperwork and getting everything in order. You'll get a link to your own portal where you can see exactly where things stand at any time — no need to call and ask.

If anything comes up, reply to this email or call me directly.

Best regards,
{{agentName}}
{{brokerage}}`,
  },
  {
    id: "doc_request",
    name: "Document Request",
    subject: "A few documents needed for {{propertyAddress}}",
    body: `Hi {{clientName}},

We're moving along nicely on {{propertyAddress}}. To keep things on schedule, I need a few items from you:

{{pendingDocuments}}

You can reply to this email with them attached, or upload them through your portal — whichever is easier.

Thanks,
{{agentName}}`,
  },
  {
    id: "offer_update",
    name: "Offer Status Update",
    subject: "Update on the offer — {{propertyAddress}}",
    body: `Hi {{clientName}},

Quick update on {{propertyAddress}}.

{{offerSummary}}

I'd like to walk you through the details and what I'd recommend. Let me know a good time to talk today.

Best,
{{agentName}}`,
  },
  {
    id: "under_contract",
    name: "Under Contract Confirmation",
    subject: "We're under contract on {{propertyAddress}}",
    body: `Hi {{clientName}},

Good news — {{propertyAddress}} is officially under contract at {{price}}.

Here's what happens over the next few weeks: the inspection period opens first, then the appraisal, then final loan approval. I've already calendared every deadline and I'll let you know ahead of each one.

You don't need to do anything right now. I'll reach out when I need you.

Best,
{{agentName}}`,
  },
  {
    id: "inspection_notice",
    name: "Inspection Scheduling",
    subject: "Scheduling the inspection for {{propertyAddress}}",
    body: `Hi {{clientName}},

It's time to schedule the home inspection for {{propertyAddress}}. This needs to happen inside the option period, so the sooner we book it the better.

Let me know which days work and I'll coordinate access.

Thanks,
{{agentName}}`,
  },
  {
    id: "closing_reminder",
    name: "Closing Reminder",
    subject: "Closing is coming up — {{propertyAddress}}",
    body: `Dear {{clientName}},

Closing on {{propertyAddress}} is scheduled for {{closingDate}}.

Please bring a government-issued photo ID. If you're wiring funds, call me to verify the wire instructions by phone before sending anything — wire fraud in real estate is common and this one call prevents it.

I'll be there with you. See you at closing.

{{agentName}}`,
  },
  {
    id: "post_close",
    name: "Post-Close Thank You",
    subject: "Congratulations, {{clientName}}",
    body: `{{clientName}},

Congratulations — {{propertyAddress}} is officially closed.

It was a genuine pleasure working with you. If you ever need anything, whether it's a contractor recommendation or a question about the market, I'm a phone call away.

If you have a moment, an online review would mean a great deal to me.

All the best,
{{agentName}}`,
  },
];

export function createTransactionFromIntake(
  answers: IntakeAnswers,
  overrides?: Partial<TransactionFile>
): TransactionFile {
  const now = new Date().toISOString();
  const id = uuid();

  return {
    id,
    clientName: answers.clientName,
    phone: answers.phone,
    email: answers.email,
    side: answers.side,
    propertyAddress: answers.propertyAddress,
    status: "prospective",
    isReferral: answers.isReferral,
    isRelocation: answers.isRelocation,
    builtBefore1978: answers.builtBefore1978,
    referralSource: answers.referralSource,
    referralPercentage: answers.referralPercentage,
    leadSource: answers.leadSource,
    coClientName: answers.coClientName,
    coClientContact: answers.coClientContact,
    websiteOrSocial: answers.websiteOrSocial,
    petNames: answers.petNames,
    preferredContact: answers.preferredContact,
    preferredContactTime: answers.preferredContactTime,
    isQuickLead: false,
    listPrice: 0,
    createdAt: now,
    updatedAt: now,
    checklist: generateChecklist(answers),
    documents: generateDocuments(answers),
    sentEmails: [],
    messages: [],
    notes: [],
    activity: [
      {
        id: uuid(),
        type: "status_change",
        description: "File created",
        actor: "System",
        createdAt: now,
      },
    ],
    offers: [],
    financials: {
      listPrice: 0,
      commissionRate: 0.03,
      earnestMoney: 0,
      earnestMoneyStatus: "pending",
      referralPercentage: answers.referralPercentage,
    },
    ...createDefaultWorkFields(answers),
    ...overrides,
  };
}

export interface TemplateContext {
  agentName?: string;
  brokerage?: string;
}

export function interpolateTemplate(
  template: string,
  file: TransactionFile,
  ctx: TemplateContext = {}
): string {
  const pending = file.documents.filter((d) => d.status === "needed");
  const pendingList = pending.length
    ? pending.slice(0, 5).map((d) => `  \u2022 ${d.name}`).join("\n")
    : "  \u2022 Nothing outstanding right now";

  const accepted = file.offers.find((o) => o.status === "accepted");
  const offerSummary = accepted
    ? `We have an accepted offer at ${formatMoney(accepted.amount)} from ${accepted.buyerName}.`
    : file.offers.length > 0
    ? `We currently have ${file.offers.length} offer${file.offers.length === 1 ? "" : "s"} on the table, ranging from ${formatMoney(
        Math.min(...file.offers.map((o) => o.amount))
      )} to ${formatMoney(Math.max(...file.offers.map((o) => o.amount)))}.`
    : "No offers have come in yet.";

  return template
    .replace(/\{\{clientName\}\}/g, file.clientName)
    .replace(/\{\{propertyAddress\}\}/g, file.propertyAddress)
    .replace(/\{\{price\}\}/g, formatMoney(file.listPrice))
    .replace(/\{\{closingDate\}\}/g, file.closingDate ? format(new Date(file.closingDate), "EEEE, MMMM d") : "a date to be confirmed")
    .replace(/\{\{pendingDocuments\}\}/g, pendingList)
    .replace(/\{\{offerSummary\}\}/g, offerSummary)
    .replace(/\{\{agentName\}\}/g, ctx.agentName ?? "Your Agent")
    .replace(/\{\{brokerage\}\}/g, ctx.brokerage ?? "");
}

function formatMoney(n: number): string {
  return `$${Math.round(n).toLocaleString()}`;
}

export const CLIENT_TIMELINE_STEPS = [
  { key: "listed", label: "Listed", blurb: "Your property is live and being marketed." },
  { key: "offer_accepted", label: "Offer Accepted", blurb: "Terms are agreed and signed." },
  { key: "under_contract", label: "Under Contract", blurb: "Inspection, appraisal, and financing." },
  { key: "closing", label: "Closing", blurb: "Final signing and handover of keys." },
] as const;

export type ClientTimelineState = "done" | "current" | "upcoming";

/**
 * Maps the agent-side status onto the four milestones a client actually
 * understands. Buyer files use the same four steps with buyer-side wording
 * handled at render time.
 */
export function getClientTimelineState(status: TransactionFile["status"]) {
  // How far along each status sits on the client-visible timeline.
  const reached: Record<TransactionFile["status"], number> = {
    prospective: 0,
    buyer_agency: 0,
    listed: 1,
    in_progress: 1,
    under_contract: 3,
    // A closed file is past every milestone, so all four read as done.
    closed: 5,
    dropped: 0,
    terminated: 1,
  };

  const progress = reached[status];
  const stalled = status === "dropped" || status === "terminated";

  return CLIENT_TIMELINE_STEPS.map((step, i) => {
    const position = i + 1;
    let state: ClientTimelineState = "upcoming";
    if (progress > position) state = "done";
    else if (progress === position) state = stalled ? "done" : "current";
    // A stalled file shows how far it got, but never a "current" step.
    if (stalled && state === "current") state = "done";
    return { ...step, state };
  });
}

export function getClientActionNeeded(file: TransactionFile): string | null {
  if (file.status === "closed" || file.status === "dropped" || file.status === "terminated") {
    return null;
  }

  // Anything the client themselves owes takes priority over general guidance.
  const fromClient = file.documents.filter(
    (d) => d.status === "needed" && d.expectedFrom === "Client"
  );
  if (fromClient.length === 1) {
    return `We need your ${fromClient[0].name}.`;
  }
  if (fromClient.length > 1) {
    return `We need ${fromClient.length} documents from you, starting with your ${fromClient[0].name}.`;
  }

  if (file.status === "under_contract") {
    return "Nothing right now — we'll reach out before the walkthrough.";
  }
  if (file.status === "prospective" || file.status === "buyer_agency") {
    return "Review and sign your agency agreement.";
  }
  if (file.status === "in_progress") {
    return "Keep the property available for showings this week.";
  }
  return "Nothing needed from you right now.";
}

/* ────────────────────────────────────────────────────────────────────────
 * Checklist template library — the rules the Settings screen exposes.
 * Derived from the same BASE_TASKS the engine runs on, so the screen can
 * never drift from what actually generates.
 * ──────────────────────────────────────────────────────────────────────── */

function describeConditions(t: TaskTemplate): { text: string; conditional: boolean } {
  const c = t.conditions;
  if (!c) return { text: "Every transaction", conditional: false };

  const parts: string[] = [];
  if (c.side === "listing") parts.push("listing files");
  if (c.side === "buying") parts.push("buyer files");
  if (c.isReferral) parts.push("the file is flagged as a referral");
  if (c.isRelocation) parts.push("the file is flagged as a relocation");
  if (c.builtBefore1978) parts.push("the property was built before 1978");

  const onlySide = parts.length === 1 && c.side !== undefined;
  return {
    text: onlySide ? `All ${parts[0]}` : `When ${parts.join(" and ")}`,
    conditional: !onlySide,
  };
}

export function getChecklistTemplateRules(): ChecklistTemplateRule[] {
  const byId = new Map(BASE_TASKS.map((t) => [t.id, t]));
  return BASE_TASKS.map((t) => {
    const { text, conditional } = describeConditions(t);
    return {
      id: t.id,
      taskTitle: t.title,
      phase: t.phase,
      appliesWhen: text,
      isConditional: conditional,
      dependsOnTitles: t.dependsOn.map((d) => byId.get(d)?.title ?? d),
      subtaskCount: t.subtasks?.length ?? 0,
    };
  });
}

export const TEMPLATE_TASK_COUNT = BASE_TASKS.length;

/* ────────────────────────────────────────────────────────────────────────
 * Guided intake assist.
 *
 * In the finished product this is a language model reading free-text call
 * notes. Here it is deterministic pattern matching over the same input, so
 * the demo behaves identically every time it is shown. Everything it finds
 * is offered back for confirmation — nothing is applied silently.
 * ──────────────────────────────────────────────────────────────────────── */

export interface ExtractedField {
  field: keyof IntakeAnswers;
  label: string;
  value: string | number | boolean;
  /** Human-readable form of `value`, for showing back to the agent. */
  display: string;
  /** What in the notes produced this, shown so the agent can sanity-check it. */
  evidence: string;
}

const PHONE_RE = /(\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/;
const EMAIL_RE = /[\w.+-]+@[\w-]+(?:\.[\w-]+)*\.[a-zA-Z]{2,}/;

function sentenceContaining(text: string, needle: string): string {
  const sentences = text.split(/(?<=[.!?\n])\s+/);
  const hit = sentences.find((x) => x.toLowerCase().includes(needle.toLowerCase()));
  return (hit ?? needle).trim().replace(/\s+/g, " ").slice(0, 120);
}

export function extractFromCallNotes(notes: string): ExtractedField[] {
  const found: ExtractedField[] = [];
  const text = notes.trim();
  if (!text) return found;
  const lower = text.toLowerCase();

  const phone = text.match(PHONE_RE)?.[0];
  if (phone) {
    found.push({
      field: "phone",
      label: "Phone number",
      value: phone.trim(),
      display: phone.trim(),
      evidence: sentenceContaining(text, phone),
    });
  }

  const email = text.match(EMAIL_RE)?.[0];
  if (email) {
    found.push({
      field: "email",
      label: "Email address",
      value: email,
      display: email,
      evidence: sentenceContaining(text, email),
    });
  }

  // "Spoke with Sarah Mitchell", "Call with the Chens", "Met James Okafor"
  const nameMatch = text.match(
    /(?:[Ss]poke (?:with|to)|[Cc]all (?:with|from)|[Mm]et(?: with)?|[Tt]alked to|[Ss]poke)\s+([A-Z][a-zA-Z'-]+(?:(?:\s+(?:and|&))?\s+[A-Z][a-zA-Z'-]+){0,2})/
  );
  if (nameMatch) {
    found.push({
      field: "clientName",
      label: "Client name",
      value: nameMatch[1].trim(),
      display: nameMatch[1].trim(),
      evidence: sentenceContaining(text, nameMatch[0]),
    });
  }

  // A street address: number followed by a named street type.
  const addressMatch = text.match(
    /\d{2,6}\s+[A-Z][a-zA-Z]*(?:\s+[A-Z][a-zA-Z]*){0,3}\s+(?:Street|St|Avenue|Ave|Drive|Dr|Road|Rd|Lane|Ln|Court|Ct|Boulevard|Blvd|Way|Circle|Cir|Trail|Trl|Place|Pl)\b(?:,?\s+[A-Z][a-zA-Z]+(?:\s+[A-Z]{2})?(?:\s+\d{5})?)?/
  );
  if (addressMatch) {
    found.push({
      field: "propertyAddress",
      label: "Property address",
      value: addressMatch[0].trim(),
      display: addressMatch[0].trim(),
      evidence: sentenceContaining(text, addressMatch[0]),
    });
  }

  // Which side of the deal
  const sellingSignal = /\b(sell|selling|list|listing|seller)\b/.test(lower);
  const buyingSignal = /\b(buy|buying|purchase|buyer|looking for)\b/.test(lower);
  if (sellingSignal !== buyingSignal) {
    found.push({
      field: "side",
      label: "Transaction type",
      value: sellingSignal ? "listing" : "buying",
      display: sellingSignal ? "Listing" : "Buyer",
      evidence: sentenceContaining(text, sellingSignal ? "sell" : "buy"),
    });
  }

  if (/\brefer(red|ral)\b/.test(lower)) {
    found.push({
      field: "isReferral",
      label: "Referral",
      value: true,
      display: "Yes",
      evidence: sentenceContaining(text, "refer"),
    });
  }

  if (/\brelocat(e|ion|ing)\b|\btransferr?(ed|ing)\b/.test(lower)) {
    found.push({
      field: "isRelocation",
      label: "Relocation",
      value: true,
      display: "Yes",
      evidence: sentenceContaining(text, "reloc"),
    });
  }

  // Year built, only meaningful for the pre-1978 question
  const yearMatch = text.match(/\b(?:built|constructed)\s+(?:in\s+)?(1[89]\d{2}|20[0-2]\d)/i);
  if (yearMatch) {
    const year = Number(yearMatch[1]);
    found.push({
      field: "builtBefore1978",
      label: "Built before 1978",
      value: year < 1978,
      display: year < 1978 ? `Yes — built ${year}` : `No — built ${year}`,
      evidence: sentenceContaining(text, yearMatch[0]),
    });
  }

  // Lead source
  const sourceMatch = lower.match(/\b(zillow|open house|instagram|facebook|website|sign call|past client|realtor\.com)\b/);
  if (sourceMatch) {
    const source = sourceMatch[1].replace(/\b\w/g, (c) => c.toUpperCase());
    found.push({
      field: "leadSource",
      label: "Lead source",
      value: source,
      display: source,
      evidence: sentenceContaining(text, sourceMatch[1]),
    });
  }

  // Pets — the kind of detail agents actually record
  const petMatch = text.match(/\b(?:dog|cat|puppy|kitten)s?\s+(?:named|called)\s+([A-Z][a-zA-Z]+(?:\s+and\s+[A-Z][a-zA-Z]+)?)/i);
  if (petMatch) {
    found.push({
      field: "petNames",
      label: "Pet names",
      value: petMatch[1].trim(),
      display: petMatch[1].trim(),
      evidence: sentenceContaining(text, petMatch[0]),
    });
  }

  // Preferred contact method
  const contactMatch = lower.match(/\bprefers?\s+(text|texting|email|phone|calls?)\b/);
  if (contactMatch) {
    const method = contactMatch[1].startsWith("text")
      ? "Text"
      : contactMatch[1].startsWith("email")
      ? "Email"
      : "Phone";
    found.push({
      field: "preferredContact",
      label: "Preferred contact",
      value: method,
      display: method,
      evidence: sentenceContaining(text, contactMatch[0]),
    });
  }

  return found;
}

/** The notes we prefill the assist box with, so the demo always has a payload. */
export const SAMPLE_CALL_NOTES = `Spoke with Daniel Okafor this morning — came in as a referral from the Hartley team.
He's selling 4118 Meadowbrook Lane, Austin TX 78745. House was built in 1968 so we'll need the
lead paint disclosure. Best number is (555) 412-7788, email daniel.okafor@email.com. He prefers
text during the day, calls after 6. Two dogs named Basil and Juno, so showings need notice.
Wants to be on the market within three weeks.`;
