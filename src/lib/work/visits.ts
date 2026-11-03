import type { ShowingAppointment, TransactionFile } from "@/types";

export type VisitBucket = "upcoming" | "feedback" | "done" | "cancelled";

export interface VisitRow {
  file: TransactionFile;
  appointment: ShowingAppointment;
  bucket: VisitBucket;
}

export function folderLabel(file: TransactionFile): string {
  const place = file.propertyAddress?.split(",")[0]?.trim() || "No address yet";
  const side = file.side === "listing" ? "Listing" : "Buyer";
  return `${place} — ${file.clientName} (${side})`;
}

export function visitPlace(file: TransactionFile, appointment: ShowingAppointment): string {
  if (file.side === "buying" && appointment.propertyAddress?.trim()) {
    return appointment.propertyAddress.trim();
  }
  return file.propertyAddress?.trim() || file.clientName;
}

export function visitBucket(appointment: ShowingAppointment, now = Date.now()): VisitBucket {
  if (appointment.status === "cancelled") return "cancelled";
  if (new Date(appointment.scheduledAt).getTime() > now) return "upcoming";
  if (!appointment.feedback.trim()) return "feedback";
  return "done";
}

/** Same person, same minute, same house. A cancelled visit does not block a new one. */
export function sameVisitSlot(
  existing: ShowingAppointment,
  next: { agentOrBuyer: string; scheduledAt: string; propertyAddress?: string }
): boolean {
  if (existing.status === "cancelled") return false;
  const samePerson =
    existing.agentOrBuyer.trim().toLowerCase() === next.agentOrBuyer.trim().toLowerCase();
  const sameMinute =
    Math.abs(new Date(existing.scheduledAt).getTime() - new Date(next.scheduledAt).getTime()) < 60_000;
  const sameHouse =
    (existing.propertyAddress ?? "").trim().toLowerCase() ===
    (next.propertyAddress ?? "").trim().toLowerCase();
  return samePerson && sameMinute && sameHouse;
}

export function listVisits(files: TransactionFile[], now = Date.now()): VisitRow[] {
  const rows: VisitRow[] = [];
  for (const file of files) {
    for (const appointment of file.showings?.appointments ?? []) {
      rows.push({ file, appointment, bucket: visitBucket(appointment, now) });
    }
  }
  const rank: Record<VisitBucket, number> = { upcoming: 0, feedback: 1, done: 2, cancelled: 3 };
  return rows.sort((a, b) => {
    const byBucket = rank[a.bucket] - rank[b.bucket];
    if (byBucket !== 0) return byBucket;
    const aTime = new Date(a.appointment.scheduledAt).getTime();
    const bTime = new Date(b.appointment.scheduledAt).getTime();
    return a.bucket === "upcoming" ? aTime - bTime : bTime - aTime;
  });
}

export function toDateTimeLocal(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
