import { ensureWorkFields } from "@/lib/work/defaults";
import type { TransactionFile, TransactionSide, TransactionStatus } from "@/types";

/** Same open statuses the rest of the portfolio uses. */
const OPEN_STATUSES: TransactionStatus[] = [
  "prospective",
  "listed",
  "buyer_agency",
  "in_progress",
  "under_contract",
];

/** One folder this person is on. */
export interface ContactFile {
  id: string;
  address: string;
  side: TransactionSide;
  status: TransactionStatus;
  listPrice: number;
  leadSource: string;
  isReferral: boolean;
  referralSource: string;
  isRelocation: boolean;
  updatedAt: string;
  isOpen: boolean;
}

/**
 * One client on the signed-in agent's books.
 * Built only from transaction files, so a new file shows up here by itself.
 * Two files with the same email are the same person.
 */
export interface ClientContact {
  key: string;
  name: string;
  phone: string;
  email: string;
  preferredContact: string;
  preferredContactTime: string;
  coClientName: string;
  coClientContact: string;
  petNames: string;
  relationshipHistory: string;
  goals: string;
  timeline: string;
  /** Newest note, used when the profile story is still empty. */
  latestNote: string;
  files: ContactFile[];
  openCount: number;
}

function contactKey(file: TransactionFile): string {
  const email = file.email.trim().toLowerCase();
  if (email) return `email:${email}`;
  const name = file.clientName.trim().toLowerCase();
  if (name) return `name:${name}`;
  return `file:${file.id}`;
}

function newestFirst(files: TransactionFile[]): TransactionFile[] {
  return [...files].sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
}

function firstFilled(files: TransactionFile[], read: (file: TransactionFile) => string | undefined): string {
  for (const file of newestFirst(files)) {
    const value = (read(file) ?? "").trim();
    if (value) return value;
  }
  return "";
}

function toContact(key: string, group: TransactionFile[]): ClientContact {
  const files: ContactFile[] = group
    .map((file) => ({
      id: file.id,
      address: file.propertyAddress.trim(),
      side: file.side,
      status: file.status,
      listPrice: file.listPrice,
      leadSource: (file.leadSource ?? "").trim(),
      isReferral: file.isReferral,
      referralSource: (file.referralSource ?? "").trim(),
      isRelocation: file.isRelocation,
      updatedAt: file.updatedAt,
      isOpen: OPEN_STATUSES.includes(file.status),
    }))
    .sort((a, b) => {
      if (a.isOpen !== b.isOpen) return a.isOpen ? -1 : 1;
      return (b.updatedAt || "").localeCompare(a.updatedAt || "");
    });

  const notes = group
    .flatMap((file) => file.notes ?? [])
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

  return {
    key,
    name: firstFilled(group, (file) => file.clientName) || "Unnamed client",
    phone: firstFilled(group, (file) => file.phone),
    email: firstFilled(group, (file) => file.email),
    preferredContact: firstFilled(group, (file) => file.clientProfile?.preferredContact || file.preferredContact),
    preferredContactTime: firstFilled(
      group,
      (file) => file.clientProfile?.preferredContactTime || file.preferredContactTime
    ),
    coClientName: firstFilled(group, (file) => file.coClientName),
    coClientContact: firstFilled(group, (file) => file.coClientContact),
    petNames: firstFilled(group, (file) => file.petNames),
    relationshipHistory: firstFilled(group, (file) => file.clientProfile?.relationshipHistory),
    goals: firstFilled(group, (file) => file.clientProfile?.goals),
    timeline: firstFilled(group, (file) => file.clientProfile?.timeline),
    latestNote: (notes[0]?.content ?? "").trim(),
    files,
    openCount: files.filter((file) => file.isOpen).length,
  };
}

/** Every client on the current agent's files, open work first, then A to Z. */
export function buildContacts(files: TransactionFile[]): ClientContact[] {
  const groups = new Map<string, TransactionFile[]>();
  for (const file of files.map(ensureWorkFields)) {
    const key = contactKey(file);
    const list = groups.get(key) ?? [];
    list.push(file);
    groups.set(key, list);
  }

  return [...groups.entries()]
    .map(([key, group]) => toContact(key, group))
    .sort((a, b) => {
      const aOpen = a.openCount > 0;
      const bOpen = b.openCount > 0;
      if (aOpen !== bOpen) return aOpen ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
}

export function filterContacts(
  contacts: ClientContact[],
  status: TransactionStatus | "all",
  side: "all" | TransactionSide,
  query: string
): ClientContact[] {
  const q = query.trim().toLowerCase();
  return contacts.filter((contact) => {
    const matchesFile = contact.files.some((file) => {
      if (status !== "all" && file.status !== status) return false;
      if (side !== "all" && file.side !== side) return false;
      return true;
    });
    if (!matchesFile) return false;
    if (!q) return true;
    const haystack = [
      contact.name,
      contact.phone,
      contact.email,
      contact.coClientName,
      contact.coClientContact,
      contact.preferredContact,
      contact.relationshipHistory,
      contact.goals,
      contact.timeline,
      contact.latestNote,
      ...contact.files.flatMap((file) => [file.address, file.leadSource, file.referralSource]),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function contactTotals(contacts: ClientContact[]) {
  return {
    clients: contacts.length,
    active: contacts.filter((contact) => contact.openCount > 0).length,
    selling: contacts.filter((contact) => contact.files.some((file) => file.side === "listing")).length,
    buying: contacts.filter((contact) => contact.files.some((file) => file.side === "buying")).length,
  };
}
