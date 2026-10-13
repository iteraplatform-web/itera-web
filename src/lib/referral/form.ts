import { makePlaceholderPdf } from "@/lib/files/placeholder-pdf";

/** Printed on every referral PDF so the reader knows this file is ours. */
export const REFERRAL_MARKER = "ITERA-REFERRAL-V1";

export interface ReferralForm {
  clientName: string;
  phone: string;
  email: string;
  side: "listing" | "buying";
  propertyAddress: string;
  referringAgent: string;
  referringBrokerage: string;
  receivingAgent: string;
  receivingEmail: string;
  referralPercentage: number;
  goals: string;
  timeline: string;
  preferredContact: string;
  preferredContactTime: string;
  situation: string;
}

/** What gets saved on the CRM client profile after the agent accepts the read. */
export interface ReferralProfile {
  relationshipHistory: string;
  goals: string;
  timeline: string;
  preferredContact: string;
  preferredContactTime: string;
}

export interface ReferralField {
  field: string;
  label: string;
  value: string | number | boolean;
  display: string;
}

export interface ReferralRead {
  fields: ReferralField[];
  profile: ReferralProfile;
  /** Short brief written from the form. The agent sees this before anything is saved. */
  summary: string;
}

export const SAMPLE_REFERRAL: ReferralForm = {
  clientName: "Priya Nandakumar",
  phone: "(555) 014-2281",
  email: "priya.nandakumar@email.com",
  side: "buying",
  propertyAddress: "3BR near Mueller, Austin, under $650K",
  referringAgent: "Helen Cho",
  referringBrokerage: "Northline Realty",
  receivingAgent: "Demo Agent",
  receivingEmail: "agent@summit.example",
  referralPercentage: 25,
  goals: "First home, close before summer, wants a yard for a dog",
  timeline: "Ready to write offers within 30 days",
  preferredContact: "Text",
  preferredContactTime: "Evenings after 6pm",
  situation: "Relocating from Dallas. Pre-approved. Referred after an open house Helen hosted.",
};

function clean(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

/** One labeled row, wrapped so a long note still fits on the page and can be read back. */
function pushField(lines: string[], label: string, value: string) {
  const text = clean(value);
  if (!text) {
    lines.push(`${label}:`);
    return;
  }
  const words = text.split(" ");
  let current = `${label}:`;
  for (const word of words) {
    const next = current === `${label}:` ? `${label}: ${word}` : `${current} ${word}`;
    if (next.length > 88 && current !== `${label}:`) {
      lines.push(current);
      current = `  ${word}`;
    } else {
      current = next;
    }
  }
  lines.push(current);
}

export function referralFormLines(form: ReferralForm): string[] {
  const lines: string[] = [`Form id: ${REFERRAL_MARKER}`];
  pushField(lines, "Client name", form.clientName);
  pushField(lines, "Phone", form.phone);
  pushField(lines, "Email", form.email);
  pushField(lines, "Side", form.side === "buying" ? "Buying" : "Listing");
  pushField(lines, "Property", form.propertyAddress);
  pushField(lines, "Referring agent", form.referringAgent);
  pushField(lines, "Referring brokerage", form.referringBrokerage);
  pushField(lines, "Receiving agent", form.receivingAgent);
  pushField(lines, "Receiving email", form.receivingEmail);
  pushField(lines, "Referral fee", form.referralPercentage ? `${form.referralPercentage}%` : "");
  pushField(lines, "Goals", form.goals);
  pushField(lines, "Timeline", form.timeline);
  pushField(lines, "Preferred contact", form.preferredContact);
  pushField(lines, "Best time", form.preferredContactTime);
  pushField(lines, "Situation", form.situation);
  return lines;
}

export function buildReferralPdf(form: ReferralForm): Blob {
  return makePlaceholderPdf("Referral form", referralFormLines(form));
}

export function referralFileName(clientName: string): string {
  const slug = clean(clientName).replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "") || "client";
  return `Referral-${slug}.pdf`;
}

function unescapePdf(value: string): string {
  return value.replace(/\\([\\()])/g, "$1");
}

function pdfTextLines(pdf: string): string[] {
  const lines: string[] = [];
  const re = /\((?:\\.|[^\\)])*\)\s*Tj/g;
  for (const match of pdf.matchAll(re)) {
    const raw = match[0];
    const inner = raw.slice(1, raw.lastIndexOf(")"));
    lines.push(unescapePdf(inner));
  }
  return lines;
}

const KNOWN_LABELS = new Set([
  "Form id",
  "Client name",
  "Phone",
  "Email",
  "Side",
  "Property",
  "Referring agent",
  "Referring brokerage",
  "Receiving agent",
  "Receiving email",
  "Referral fee",
  "Goals",
  "Timeline",
  "Preferred contact",
  "Best time",
  "Situation",
]);

function labeledFields(lines: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  let current = "";
  for (const line of lines) {
    if (line.startsWith("  ") && current) {
      map[current] = clean(`${map[current]} ${line}`);
      continue;
    }
    const split = line.indexOf(":");
    if (split < 2) continue;
    const label = line.slice(0, split).trim();
    if (!KNOWN_LABELS.has(label)) continue;
    current = label;
    map[label] = clean(line.slice(split + 1));
  }
  return map;
}

function feeNumber(value: string): number {
  const match = value.match(/\d+(\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

/**
 * Turns the form into a short client brief.
 * This runs in the browser from the words on the form. No outside AI service is called.
 */
export function analyzeReferral(form: ReferralForm): { profile: ReferralProfile; summary: string } {
  const who = form.referringBrokerage
    ? `${form.referringAgent} at ${form.referringBrokerage}`
    : form.referringAgent || "another agent";
  const fee = form.referralPercentage ? ` Referral fee on the form: ${form.referralPercentage}%.` : "";
  const sideWord = form.side === "buying" ? "buying" : "selling";
  const sentTo = form.receivingAgent
    ? ` Sent to ${form.receivingAgent}${form.receivingEmail ? ` (${form.receivingEmail})` : ""}.`
    : "";

  const relationshipHistory = clean(
    `Referred by ${who}.${fee}${form.situation ? ` ${form.situation}` : ""}${sentTo}`
  );
  const goals =
    clean(form.goals) ||
    `Help this client with ${sideWord}${form.propertyAddress ? `: ${form.propertyAddress}` : ""}.`;
  const timeline = clean(form.timeline) || "No timeline was written on the form.";

  const goalSentence = goals.endsWith(".") ? goals : `${goals}.`;
  const summary = clean(
    `${form.clientName || "This client"} is ${sideWord}${
      form.propertyAddress ? ` (${form.propertyAddress})` : ""
    }. ${goalSentence} Timing: ${timeline}${fee}`
  );

  return {
    profile: {
      relationshipHistory,
      goals,
      timeline,
      preferredContact: clean(form.preferredContact),
      preferredContactTime: clean(form.preferredContactTime),
    },
    summary,
  };
}

function formFromLabels(labels: Record<string, string>): ReferralForm | null {
  if (labels["Form id"] !== REFERRAL_MARKER) return null;
  if (!labels["Client name"]) return null;
  const side = labels["Side"]?.toLowerCase() === "buying" ? "buying" : "listing";
  return {
    clientName: labels["Client name"] ?? "",
    phone: labels["Phone"] ?? "",
    email: labels["Email"] ?? "",
    side,
    propertyAddress: labels["Property"] ?? "",
    referringAgent: labels["Referring agent"] ?? "",
    referringBrokerage: labels["Referring brokerage"] ?? "",
    receivingAgent: labels["Receiving agent"] ?? "",
    receivingEmail: labels["Receiving email"] ?? "",
    referralPercentage: feeNumber(labels["Referral fee"] ?? ""),
    goals: labels["Goals"] ?? "",
    timeline: labels["Timeline"] ?? "",
    preferredContact: labels["Preferred contact"] ?? "",
    preferredContactTime: labels["Best time"] ?? "",
    situation: labels["Situation"] ?? "",
  };
}

export function readReferralText(pdf: string): ReferralRead | { error: string } {
  if (!pdf.includes(REFERRAL_MARKER)) {
    return {
      error:
        "This PDF is not an ITERA referral form. Download one from a file's Messages page, or use the sample form.",
    };
  }
  const form = formFromLabels(labeledFields(pdfTextLines(pdf)));
  if (!form) {
    return { error: "The form was found, but the client name was missing. Fill that in and try again." };
  }
  const { profile, summary } = analyzeReferral(form);
  const source = [form.referringAgent, form.referringBrokerage].filter(Boolean).join(", ");
  const fields: ReferralField[] = [
    { field: "clientName", label: "Client name", value: form.clientName, display: form.clientName },
    { field: "phone", label: "Phone", value: form.phone, display: form.phone },
    { field: "email", label: "Email", value: form.email, display: form.email },
    {
      field: "side",
      label: "Listing or buying",
      value: form.side,
      display: form.side === "buying" ? "Buying" : "Listing",
    },
    {
      field: "propertyAddress",
      label: "Property",
      value: form.propertyAddress,
      display: form.propertyAddress,
    },
    { field: "isReferral", label: "Referral", value: true, display: "Yes" },
    { field: "referralSource", label: "Referred by", value: source, display: source || "Referral form" },
    {
      field: "referralPercentage",
      label: "Referral fee",
      value: form.referralPercentage,
      display: form.referralPercentage ? `${form.referralPercentage}%` : "Not on the form",
    },
    { field: "leadSource", label: "Lead source", value: "Referral", display: "Referral" },
    {
      field: "preferredContact",
      label: "Preferred contact",
      value: form.preferredContact,
      display: form.preferredContact || "Not on the form",
    },
    {
      field: "preferredContactTime",
      label: "Best time",
      value: form.preferredContactTime,
      display: form.preferredContactTime || "Not on the form",
    },
  ].filter((field) => field.display && field.display !== "Not on the form");

  return { fields, profile, summary };
}

export async function readReferralPdf(file: Blob): Promise<ReferralRead | { error: string }> {
  const text = await file.text();
  return readReferralText(text);
}
