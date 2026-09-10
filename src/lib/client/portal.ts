import { differenceInCalendarDays, parseISO } from "date-fns";
import type { ChecklistTask, TransactionFile } from "@/types";

/* ────────────────────────────────────────────────────────────────────────
 * What the client is allowed to see, in words a client uses.
 *
 * The agent's checklist has dozens of internal steps. The client sees a
 * curated set of milestones — the outcomes they care about — each translated
 * into plain English with a line on what it means for them. Everything is
 * derived from the same checklist, so it can never disagree with it.
 * ──────────────────────────────────────────────────────────────────────── */

export type ClientStageKey = "ready" | "market" | "contract" | "closing";

export interface MilestoneDef {
  taskId: string;
  label: string;
  meaning: string;
  stage: ClientStageKey;
}

const LISTING_MILESTONES: MilestoneDef[] = [
  { taskId: "listing_agreement", label: "Listing agreement signed", meaning: "You and your agent agreed the price, terms, and length of the listing.", stage: "ready" },
  { taskId: "cma", label: "Asking price set", meaning: "Your agent compared recent sales nearby to recommend a price.", stage: "ready" },
  { taskId: "property_prep", label: "Home prepared for sale", meaning: "Repairs and staging so the home shows at its best.", stage: "ready" },
  { taskId: "property_photos", label: "Professional photos taken", meaning: "The photos buyers will see first online.", stage: "ready" },
  { taskId: "mls_entry", label: "Live on the market", meaning: "Your home is listed and visible to buyers and their agents.", stage: "market" },
  { taskId: "marketing_launch", label: "Marketing under way", meaning: "Online listings, social posts, and open houses.", stage: "market" },
  { taskId: "offer_review", label: "Offers reviewed", meaning: "Every offer compared with you so you can choose.", stage: "market" },
  { taskId: "executed_contract", label: "Contract signed by both sides", meaning: "The sale is agreed. The clock starts on the buyer's deadlines.", stage: "contract" },
  { taskId: "earnest_money", label: "Buyer's deposit received", meaning: "The buyer's good-faith money is held safely by the title company.", stage: "contract" },
  { taskId: "inspection", label: "Home inspection", meaning: "The buyer's inspector checks the home. Repairs may be requested.", stage: "contract" },
  { taskId: "appraisal", label: "Appraisal", meaning: "The buyer's lender confirms the home is worth the price.", stage: "contract" },
  { taskId: "financing_contingency", label: "Buyer's loan approved", meaning: "The buyer's financing is confirmed — a big step toward closing.", stage: "contract" },
  { taskId: "final_walkthrough", label: "Final walkthrough", meaning: "The buyer visits once more just before closing.", stage: "closing" },
  { taskId: "closing", label: "Closing day", meaning: "Papers are signed, funds move, and keys are handed over.", stage: "closing" },
];

const BUYER_MILESTONES: MilestoneDef[] = [
  { taskId: "buyer_agreement", label: "Agreement with your agent signed", meaning: "Your agent formally represents you in the purchase.", stage: "ready" },
  { taskId: "buyer_preapproval", label: "Loan pre-approval on file", meaning: "Shows sellers you can buy — needed before making offers.", stage: "ready" },
  { taskId: "property_search", label: "Home search set up", meaning: "You get new listings that match what you want, as soon as they appear.", stage: "market" },
  { taskId: "showings_buyer", label: "Touring homes", meaning: "Visiting the homes on your shortlist.", stage: "market" },
  { taskId: "submit_offer", label: "Offer made", meaning: "Your offer is with the seller.", stage: "market" },
  { taskId: "earnest_money_buyer", label: "Deposit delivered", meaning: "Your good-faith money is held by the title company.", stage: "contract" },
  { taskId: "inspection_buyer", label: "Home inspection", meaning: "A professional checks the home so there are no surprises.", stage: "contract" },
  { taskId: "appraisal_buyer", label: "Appraisal", meaning: "Your lender confirms the home is worth what you're paying.", stage: "contract" },
  { taskId: "financing_buyer", label: "Loan approved", meaning: "Your lender has given final approval — you're clear to close.", stage: "contract" },
  { taskId: "insurance_buyer", label: "Home insurance in place", meaning: "Required by your lender before closing.", stage: "closing" },
  { taskId: "final_walkthrough_buyer", label: "Final walkthrough", meaning: "One last look to make sure everything is as agreed.", stage: "closing" },
  { taskId: "closing_buyer", label: "Closing day — keys!", meaning: "Sign, fund, and collect your keys.", stage: "closing" },
];

export const STAGE_INFO: Record<ClientStageKey, { listing: string; buying: string; blurb: Record<"listing" | "buying", string> }> = {
  ready: {
    listing: "Getting ready",
    buying: "Getting ready",
    blurb: {
      listing: "Paperwork, pricing, and preparing your home before it goes on the market.",
      buying: "Paperwork and your loan pre-approval, so you're ready to make offers.",
    },
  },
  market: {
    listing: "On the market",
    buying: "Finding your home",
    blurb: {
      listing: "Buyers are touring your home. Your agent collects feedback and handles offers.",
      buying: "Touring homes that fit, then making an offer on the right one.",
    },
  },
  contract: {
    listing: "Under contract",
    buying: "Under contract",
    blurb: {
      listing: "An offer is accepted. The buyer inspects, appraises, and finalises their loan.",
      buying: "Your offer is accepted. Inspection, appraisal, and final loan approval happen now.",
    },
  },
  closing: {
    listing: "Closing",
    buying: "Closing",
    blurb: {
      listing: "The final walkthrough, signing, and handing over the keys.",
      buying: "The final walkthrough, signing, and getting your keys.",
    },
  },
};

export const STAGE_ORDER: ClientStageKey[] = ["ready", "market", "contract", "closing"];

export type MilestoneState = "done" | "now" | "upcoming";

export interface ClientMilestone extends MilestoneDef {
  state: MilestoneState;
  date?: string;
}

export function getClientMilestones(file: TransactionFile): ClientMilestone[] {
  const defs = file.side === "listing" ? LISTING_MILESTONES : BUYER_MILESTONES;
  const byId = new Map(file.checklist.map((t) => [t.id, t]));
  return defs
    .filter((d) => byId.has(d.taskId))
    .map((d) => {
      const t = byId.get(d.taskId) as ChecklistTask;
      const state: MilestoneState =
        t.status === "completed" ? "done" : t.status === "blocked" ? "upcoming" : "now";
      return { ...d, state, date: t.status === "completed" ? t.completedAt : t.dueDate };
    });
}

/** Which of the four stages the client is in, from the milestones themselves. */
export function getClientStage(file: TransactionFile): ClientStageKey {
  if (file.status === "closed") return "closing";
  if (file.status === "under_contract") {
    const ms = getClientMilestones(file);
    const contractLeft = ms.filter((m) => m.stage === "contract" && m.state !== "done").length;
    return contractLeft === 0 ? "closing" : "contract";
  }
  if (["listed", "in_progress"].includes(file.status)) return "market";
  return "ready";
}

export function getOverallProgress(file: TransactionFile): number {
  const ms = getClientMilestones(file);
  if (file.status === "closed") return 100;
  return ms.length ? Math.round((ms.filter((m) => m.state === "done").length / ms.length) * 100) : 0;
}

export function daysToClosing(file: TransactionFile): number | null {
  return file.closingDate ? differenceInCalendarDays(parseISO(file.closingDate), new Date()) : null;
}

/* ── Updates: the agent's activity, filtered and reworded for the client ── */

export interface ClientUpdate {
  id: string;
  text: string;
  at: string;
  kind: "milestone" | "document" | "offer" | "status" | "message" | "photo" | "date" | "showing";
}

export function getClientUpdates(file: TransactionFile, limit = 20): ClientUpdate[] {
  const milestoneByTitle = new Map(
    (file.side === "listing" ? LISTING_MILESTONES : BUYER_MILESTONES).map((m) => {
      const t = file.checklist.find((x) => x.id === m.taskId);
      return [t?.title ?? "", m.label];
    })
  );
  const out: ClientUpdate[] = [];
  for (const a of file.activity) {
    const d = a.description;
    let text: string | null = null;
    let kind: ClientUpdate["kind"] = "status";
    if (d.startsWith("Completed: ")) {
      const label = milestoneByTitle.get(d.slice(11));
      if (label) {
        text = `Milestone reached: ${label}`;
        kind = "milestone";
      }
    } else if (d.startsWith("Status changed from")) {
      text = `Your file moved to ${d.split(" to ").pop()}`;
    } else if (d.startsWith("Document received: ") || d.startsWith("Document uploaded: ")) {
      text = `${d.split(": ").slice(1).join(": ")} is in`;
      kind = "document";
    } else if (d.startsWith("Offer logged")) {
      text = file.side === "listing" ? "A new offer came in" : "Your offer was submitted";
      kind = "offer";
    } else if (d.startsWith("Offer accepted") || d.endsWith("marked accepted")) {
      text = "Offer accepted";
      kind = "offer";
    } else if (d.startsWith("Email sent: ")) {
      text = `Your agent emailed you: “${d.slice(12)}”`;
      kind = "message";
    } else if (d.startsWith("Key dates updated") && d.includes("closing set to")) {
      text = `Closing date set: ${d.split("closing set to ")[1].split(/[—]/)[0].replace(/,\s*$/, "").trim()}`;
      kind = "date";
    } else if (/photos? uploaded/.test(d)) {
      text = "New photos of your home were added";
      kind = "photo";
    } else if (a.type === "showing_logged") {
      text = file.side === "listing" ? "Your home had a showing" : "You toured a home";
      kind = "showing";
    }
    if (text) out.push({ id: a.id, text, at: a.createdAt, kind });
    if (out.length >= limit) break;
  }
  return out;
}

/* ── Money: estimates the client can adjust ───────────────────────────── */

export function sellerNet(input: {
  price: number;
  listingCommissionPct: number;
  buyerAgentPct: number;
  closingCostsPct: number;
  payoff: number;
}) {
  const listingCommission = input.price * (input.listingCommissionPct / 100);
  const buyerAgent = input.price * (input.buyerAgentPct / 100);
  const closingCosts = input.price * (input.closingCostsPct / 100);
  const net = input.price - listingCommission - buyerAgent - closingCosts - input.payoff;
  return { listingCommission, buyerAgent, closingCosts, net };
}

/** Standard amortising loan payment, principal and interest. */
export function monthlyPayment(principal: number, annualRatePct: number, years: number): number {
  const r = annualRatePct / 100 / 12;
  const n = years * 12;
  if (principal <= 0) return 0;
  if (r === 0) return principal / n;
  return (principal * r) / (1 - Math.pow(1 + r, -n));
}

export function buyerCashToClose(input: {
  price: number;
  downPct: number;
  closingCostsPct: number;
  earnestMoney: number;
  ratePct: number;
  taxInsuranceMonthly: number;
}) {
  const down = input.price * (input.downPct / 100);
  const loan = input.price - down;
  const closingCosts = input.price * (input.closingCostsPct / 100);
  const cashToClose = down + closingCosts - input.earnestMoney;
  const pi = monthlyPayment(loan, input.ratePct, 30);
  return { down, loan, closingCosts, cashToClose, principalInterest: pi, monthlyTotal: pi + input.taxInsuranceMonthly };
}

/* ── Help ────────────────────────────────────────────────────────────── */

export function getFaq(side: "listing" | "buying"): { q: string; a: string }[] {
  const common = [
    { q: "How do I know what's happening?", a: "Everything important shows up here the moment your agent records it — milestones, documents, and messages. A notice appears at the top of the screen when something changes." },
    { q: "Is this where I sign documents?", a: "Not yet. Your agent sends documents for signature separately. Once signed, copies appear under Documents." },
    { q: "Who can see my messages?", a: "Only you and your agent. Your agent's internal notes are never shown here, and your messages are never shared with the other side." },
  ];
  if (side === "listing") {
    return [
      { q: "Do I need to leave during showings?", a: "Ideally, yes. Buyers speak more freely when the owner isn't home. Your agent sets a notice period so you're never surprised." },
      { q: "What happens if the inspection finds problems?", a: "The buyer may ask for repairs or a credit. Your agent will walk you through each request — you don't have to agree to all of them." },
      { q: "When do I get paid?", a: "At closing. Once documents are signed and the buyer's funds arrive, the title company pays off your mortgage and sends you the rest, usually the same or next business day." },
      { q: "What should I leave in the house?", a: "Anything attached to the home stays unless the contract says otherwise. Leave keys, garage remotes, and manuals for the new owner." },
      ...common,
    ];
  }
  return [
    { q: "How much do I need at closing?", a: "Your down payment plus closing costs, minus the deposit you already paid. The Money section estimates this; your lender sends the exact figure a few days before closing." },
    { q: "Why do I need an inspection?", a: "It's your chance to find problems before you're committed. If something serious comes up, your agent can negotiate repairs, a credit, or your exit from the contract." },
    { q: "What should I bring to closing?", a: "A government photo ID and proof your funds were sent. Always call your agent to confirm wire instructions by phone — email wire fraud is common in real estate." },
    { q: "When do I get the keys?", a: "Usually at closing, once your loan funds and the deed is recorded. Your agent will confirm the time." },
    ...common,
  ];
}
