import { format, parseISO } from "date-fns";
import { v4 as uuid } from "uuid";
import { alertsFromShowings, routineGuidelines, visitorAlertEmail } from "@/lib/work/visitor-alerts";
import type { SentEmail, ShowingAppointment, ShowingsWork, TransactionFile } from "@/types";

function whenLabel(iso: string): string {
  const d = parseISO(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return format(d, "EEE, MMM d, yyyy 'at' h:mm a");
}

/** The message a visiting agent would get. It stays inside ITERA. */
export function buildVisitNotice(input: {
  propertyAddress: string;
  listingAgent: string;
  visitorName: string;
  visitorEmail?: string;
  scheduledAt: string;
  showings: Partial<ShowingsWork>;
}): { subject: string; to: string; body: string } {
  const alerts = alertsFromShowings(input.showings);
  const rules = routineGuidelines(input.showings, alerts).map((g) => g.text.trim());
  const ruleText = rules.length
    ? rules.map((text) => `• ${text}`).join("\n")
    : "• No extra guidelines were written for this listing.";
  const important = visitorAlertEmail(input.showings);
  const email = input.visitorEmail?.trim();
  const to = email ? `${input.visitorName} <${email}>` : input.visitorName;
  const subject = `Visit guidelines — ${input.propertyAddress}`;
  const body = [
    `Hello ${input.visitorName},`,
    ``,
    `A visit is booked at ${input.propertyAddress}.`,
    `When: ${whenLabel(input.scheduledAt)}`,
    `Listing agent: ${input.listingAgent}`,
    ``,
    important,
    `Please follow these visit guidelines:`,
    ruleText,
    ``,
    email
      ? `This demo kept the message for ${email}. It was not sent through Gmail.`
      : `No email address was entered. This demo still keeps the message on the file. It was not sent through Gmail.`,
  ].join("\n");
  return { subject, to, body };
}

/** Rewrites a saved demo email so it matches the visit as it stands now. */
export function refreshVisitNotice(
  file: TransactionFile,
  appointment: ShowingAppointment,
  actor: string
) {
  if (!appointment.noticeEmailId) return;
  const email = file.sentEmails.find((item) => item.id === appointment.noticeEmailId);
  if (!email) return;
  const notice = buildVisitNotice({
    propertyAddress: file.propertyAddress || "the listing",
    listingAgent: actor,
    visitorName: appointment.agentOrBuyer,
    visitorEmail: appointment.visitorEmail,
    scheduledAt: appointment.scheduledAt,
    showings: file.showings,
  });
  email.subject = notice.subject;
  email.to = notice.to;
  email.body = notice.body;
  email.sentAt = new Date().toISOString();
  email.sentBy = actor;
}

/** Stores one demo email on the listing and remembers it on the visit. */
export function attachVisitNotice(
  file: TransactionFile,
  appointment: ShowingAppointment,
  actor: string
): SentEmail | null {
  if (file.side !== "listing") return null;
  if (appointment.noticeEmailId) {
    const existing = file.sentEmails.find((e) => e.id === appointment.noticeEmailId);
    if (existing) return existing;
    appointment.noticeEmailId = undefined;
  }
  const notice = buildVisitNotice({
    propertyAddress: file.propertyAddress || "the listing",
    listingAgent: actor,
    visitorName: appointment.agentOrBuyer,
    visitorEmail: appointment.visitorEmail,
    scheduledAt: appointment.scheduledAt,
    showings: file.showings,
  });
  const email: SentEmail = {
    id: uuid(),
    templateId: "visit_guidelines",
    subject: notice.subject,
    sentAt: new Date().toISOString(),
    sentBy: actor,
    to: notice.to,
    body: notice.body,
  };
  appointment.noticeEmailId = email.id;
  file.sentEmails.unshift(email);
  return email;
}

export function copyEmail(email: SentEmail): SentEmail {
  return {
    id: email.id,
    templateId: email.templateId,
    subject: email.subject,
    sentAt: email.sentAt,
    sentBy: email.sentBy,
    to: email.to,
    body: email.body,
  };
}
