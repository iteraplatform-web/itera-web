import { ensureWorkFields } from "@/lib/work/defaults";
import { KANBAN_COLUMNS } from "@/lib/utils/status-theme";
import type { TransactionFile, TransactionSide, TransactionStatus } from "@/types";

/** Short file code shown in the contacts table. Stable for the life of the file. */
export function shortFileId(id: string): string {
  const compact = id.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return compact.slice(0, 8);
}

export type ContactSortKey = "id" | "name" | "status" | "side" | "property" | "phone" | "updated";
export type ContactSortDirection = "asc" | "desc";

const STATUS_RANK = new Map(KANBAN_COLUMNS.map((status, index) => [status, index]));

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
  /** Eight-character code of `id`, safe to show in a column. */
  displayId: string;
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
      displayId: shortFileId(file.id),
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
  query: string,
  openOnly = false
): ClientContact[] {
  const q = query.trim().toLowerCase();
  return contacts.filter((contact) => {
    if (openOnly && contact.openCount === 0) return false;
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
      ...contact.files.flatMap((file) => [file.id, file.displayId, file.address, file.leadSource, file.referralSource]),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

/** The listing this row should show: the one that matches the filters, else the newest open file. */
export function focusFile(
  contact: ClientContact,
  status: TransactionStatus | "all" = "all",
  side: "all" | TransactionSide = "all"
): ContactFile | undefined {
  return (
    contact.files.find((file) => {
      if (status !== "all" && file.status !== status) return false;
      if (side !== "all" && file.side !== side) return false;
      return true;
    }) ?? contact.files[0]
  );
}

function sortValue(
  contact: ClientContact,
  key: ContactSortKey,
  status: TransactionStatus | "all",
  side: "all" | TransactionSide
): string | number {
  const file = focusFile(contact, status, side);
  switch (key) {
    case "id":
      return file?.displayId ?? "";
    case "name":
      return contact.name.toLowerCase();
    case "status":
      return file ? (STATUS_RANK.get(file.status) ?? 99) : 99;
    case "side":
      return file?.side === "listing" ? 0 : file ? 1 : 2;
    case "property":
      return (file?.address ?? "").toLowerCase();
    case "phone":
      return contact.phone.replace(/\D/g, "");
    case "updated":
      return file?.updatedAt ?? "";
  }
}

/** Sort a contact list. Ties fall back to name, A to Z. */
export function sortContacts(
  contacts: ClientContact[],
  key: ContactSortKey,
  direction: ContactSortDirection,
  status: TransactionStatus | "all" = "all",
  side: "all" | TransactionSide = "all"
): ClientContact[] {
  const factor = direction === "asc" ? 1 : -1;
  return [...contacts].sort((a, b) => {
    const left = sortValue(a, key, status, side);
    const right = sortValue(b, key, status, side);
    const result =
      typeof left === "number" && typeof right === "number"
        ? left - right
        : String(left).localeCompare(String(right));
    if (result !== 0) return result * factor;
    return a.name.localeCompare(b.name);
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
