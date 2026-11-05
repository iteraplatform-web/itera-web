"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  ChevronRight,
  Clock,
  Home,
  KeyRound,
  Mail,
  Phone,
  Search,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { Avatar, EmptyState } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/status-badge";
import { sectionHref } from "@/components/workspace/workspace-sidebar";
import { contactTotals, filterContacts, type ClientContact, type ContactFile } from "@/lib/selectors/contacts";
import { STATUS_LABELS, type TransactionSide, type TransactionStatus } from "@/types";

export function ContactsBoard({
  contacts,
  agentName,
}: {
  contacts: ClientContact[];
  agentName: string;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<TransactionStatus | "all">("all");
  const [side, setSide] = useState<"all" | TransactionSide>("all");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const totals = useMemo(() => contactTotals(contacts), [contacts]);
  const visible = useMemo(
    () => filterContacts(contacts, status, side, query),
    [contacts, status, side, query]
  );
  const filtersOn = status !== "all" || side !== "all" || query.trim() !== "";
  const selected = useMemo(
    () => contacts.find((contact) => contact.key === selectedKey) ?? null,
    [contacts, selectedKey]
  );

  const clear = () => {
    setQuery("");
    setStatus("all");
    setSide("all");
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <div>
        <h1 className="font-serif text-[34px] font-medium leading-tight tracking-[-0.01em] text-ink-950">
          Contacts
        </h1>
        <p className="mt-0.5 text-[15px] text-ink-500">{format(new Date(), "EEEE, MMMM d")}</p>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-500">
          Every client on {agentName}&apos;s books. Open a person for the full story, goals, and
          every file.
        </p>
      </div>

      <div className="stagger grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline shadow-sm sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Clients" value={totals.clients} icon={Users} />
        <StatTile label="With open files" value={totals.active} icon={UserRound} />
        <StatTile label="Selling" value={totals.selling} icon={Home} />
        <StatTile label="Buying" value={totals.buying} icon={KeyRound} />
      </div>

      <div className="rounded-2xl border border-hairline bg-surface p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, phone, email, or address…"
              aria-label="Search contacts"
              className="w-full rounded-xl border-0 bg-canvas py-2.5 pl-10 pr-9 text-[15px] text-ink-950 ring-1 ring-inset ring-transparent transition-shadow placeholder:text-ink-400 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-itera-500"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-ink-400 hover:bg-ink-100 hover:text-ink-600"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as TransactionStatus | "all")}
            aria-label="Status"
            className="h-10 cursor-pointer rounded-xl border-0 bg-canvas px-3 text-[15px] font-medium text-ink-700 focus:outline-none focus:ring-2 focus:ring-itera-500"
          >
            <option value="all">All statuses</option>
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={side}
            onChange={(e) => setSide(e.target.value as "all" | TransactionSide)}
            aria-label="Side"
            className="h-10 cursor-pointer rounded-xl border-0 bg-canvas px-3 text-[15px] font-medium text-ink-700 focus:outline-none focus:ring-2 focus:ring-itera-500"
          >
            <option value="all">Selling and buying</option>
            <option value="listing">Selling</option>
            <option value="buying">Buying</option>
          </select>
        </div>
      </div>

      {contacts.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No clients yet"
          description="Add a file and the client will show up here with the same name, phone, and status."
          action={
            <Link
              href="/files/new?full=true"
              className="inline-flex h-10 items-center rounded-xl bg-ink-950 px-4 text-[14px] font-semibold text-white hover:bg-ink-900"
            >
              New file
            </Link>
          }
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No clients match"
          description="Try another name, phone, or status. Clearing the filters shows everyone again."
          action={
            <button
              type="button"
              onClick={clear}
              className="inline-flex h-10 items-center rounded-xl bg-ink-950 px-4 text-[14px] font-semibold text-white hover:bg-ink-900"
            >
              Clear filters
            </button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-hairline bg-surface shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-3 sm:px-5">
            <p className="text-[13px] text-ink-500">
              <span className="tnum font-semibold text-ink-700">{visible.length}</span>
              {filtersOn ? ` of ${contacts.length}` : ""}{" "}
              {visible.length === 1 && !filtersOn ? "client" : "clients"}
            </p>
            {filtersOn && (
              <button
                type="button"
                onClick={clear}
                className="text-[13px] font-semibold text-ink-600 hover:text-ink-950"
              >
                Clear filters
              </button>
            )}
          </div>
          <div className="divide-y divide-hairline">
            {visible.map((contact) => (
              <ContactRow
                key={contact.key}
                contact={contact}
                onOpen={() => setSelectedKey(contact.key)}
              />
            ))}
          </div>
        </div>
      )}

      <ContactDetailModal contact={selected} onClose={() => setSelectedKey(null)} />
    </div>
  );
}

function StatTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
}) {
  return (
    <div className="bg-surface px-5 py-4">
      <div className="flex items-center justify-between">
        <p className="section-title">{label}</p>
        <Icon className="h-4 w-4 text-ink-400" />
      </div>
      <p className="tnum mt-2.5 text-[28px] font-bold leading-none tracking-[-0.03em] text-ink-950">{value}</p>
    </div>
  );
}

/** List row: only the facts you need to find someone. Open the popup for the rest. */
function ContactRow({ contact, onOpen }: { contact: ClientContact; onOpen: () => void }) {
  const primary = contact.files[0];
  const kind = primary ? (primary.side === "listing" ? "Selling" : "Buying") : null;
  const address = primary?.address || "No address yet";

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-canvas/70 sm:px-5"
    >
      <Avatar name={contact.name} size="md" />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-[16px] font-semibold text-ink-950">{contact.name}</span>
          {primary && <StatusBadge status={primary.status} size="sm" className="shrink-0" />}
        </span>
        <span className="mt-1 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-0.5 text-[14px] text-ink-500">
          <span className="tnum font-medium text-ink-700">{contact.phone || "No phone"}</span>
          {kind && (
            <>
              <span className="text-ink-300" aria-hidden>
                ·
              </span>
              <span>{kind}</span>
            </>
          )}
          <span className="text-ink-300" aria-hidden>
            ·
          </span>
          <span className="min-w-0 truncate">{address}</span>
        </span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-ink-300" aria-hidden />
    </button>
  );
}

function ContactDetailModal({
  contact,
  onClose,
}: {
  contact: ClientContact | null;
  onClose: () => void;
}) {
  if (!contact) return null;

  const tags = tagsFor(contact);
  const reach = [contact.preferredContact, contact.preferredContactTime].filter(Boolean).join(" · ");
  const primary = contact.files[0];

  return (
    <Modal
      open
      onClose={onClose}
      title={contact.name}
      description={
        contact.openCount > 0
          ? `${contact.openCount} open ${contact.openCount === 1 ? "file" : "files"}`
          : "No open files"
      }
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          {primary && (
            <Link href={sectionHref(primary.id, "overview")} onClick={onClose}>
              <Button variant="ink">Open file</Button>
            </Link>
          )}
        </>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Avatar name={contact.name} size="lg" />
          {tags.length > 0 ? (
            <div className="flex min-w-0 flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-ink-100 px-2.5 py-0.5 text-[12px] font-medium text-ink-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[14px] text-ink-500">Client on your books</p>
          )}
        </div>

        <section>
          <h3 className="section-title">How to reach</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <InfoCard icon={Phone} label="Phone">
              {contact.phone ? (
                <a href={`tel:${contact.phone.replace(/\D/g, "")}`} className="font-semibold text-ink-950 hover:underline">
                  {contact.phone}
                </a>
              ) : (
                <span className="text-ink-400">Not on file</span>
              )}
            </InfoCard>
            <InfoCard icon={Mail} label="Email">
              {contact.email ? (
                <a href={`mailto:${contact.email}`} className="break-all font-semibold text-ink-950 hover:underline">
                  {contact.email}
                </a>
              ) : (
                <span className="text-ink-400">Not on file</span>
              )}
            </InfoCard>
            <InfoCard icon={Clock} label="Best way to reach">
              {reach || <span className="text-ink-400">Not set</span>}
            </InfoCard>
            <InfoCard icon={UserRound} label="Also on the file">
              {contact.coClientName ? (
                <>
                  {contact.coClientName}
                  {contact.coClientContact ? (
                    <span className="mt-0.5 block text-[13px] font-normal text-ink-500">
                      {contact.coClientContact}
                    </span>
                  ) : null}
                </>
              ) : (
                <span className="text-ink-400">None</span>
              )}
            </InfoCard>
          </div>
        </section>

        {(contact.relationshipHistory || contact.goals || contact.timeline || contact.latestNote) && (
          <section>
            <h3 className="section-title">About this client</h3>
            <div className="mt-3 space-y-3 rounded-2xl bg-canvas px-4 py-4">
              {(contact.relationshipHistory || contact.latestNote) && (
                <StoryBlock
                  label="Story"
                  text={contact.relationshipHistory || contact.latestNote}
                />
              )}
              {contact.goals && <StoryBlock label="Goal" text={contact.goals} />}
              {contact.timeline && <StoryBlock label="Timeline" text={contact.timeline} />}
            </div>
          </section>
        )}

        <section>
          <h3 className="section-title">Files</h3>
          <div className="mt-3 space-y-2">
            {contact.files.map((file) => (
              <FileDetailRow key={file.id} file={file} onNavigate={onClose} />
            ))}
          </div>
        </section>
      </div>
    </Modal>
  );
}

function InfoCard({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-hairline bg-surface px-4 py-3">
      <div className="flex items-center gap-2 text-ink-400">
        <Icon className="h-3.5 w-3.5" aria-hidden />
        <p className="text-[11px] font-semibold uppercase tracking-[0.06em]">{label}</p>
      </div>
      <div className="mt-1.5 text-[14px] font-semibold leading-snug text-ink-950">{children}</div>
    </div>
  );
}

function StoryBlock({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-400">{label}</p>
      <p className="mt-1 text-[14px] leading-relaxed text-ink-700">{text}</p>
    </div>
  );
}

function FileDetailRow({ file, onNavigate }: { file: ContactFile; onNavigate: () => void }) {
  const kind = file.side === "listing" ? "Selling" : "Buying";
  const price = file.listPrice > 0 ? `$${file.listPrice.toLocaleString("en-US")}` : "Price not set";

  return (
    <Link
      href={sectionHref(file.id, "overview")}
      onClick={onNavigate}
      className="flex items-center justify-between gap-3 rounded-2xl border border-hairline bg-surface px-4 py-3 transition-colors hover:bg-canvas"
    >
      <span className="min-w-0">
        <span className="block truncate text-[14px] font-semibold text-ink-950">
          {file.address || "No address yet"}
        </span>
        <span className="mt-0.5 block text-[13px] text-ink-500">
          {kind}
          <span className="text-ink-300"> · </span>
          <span className="tnum">{price}</span>
        </span>
      </span>
      <StatusBadge status={file.status} size="sm" className="shrink-0" />
    </Link>
  );
}

function tagsFor(contact: ClientContact): string[] {
  const tags: string[] = [];
  const sources = new Set(contact.files.map((file) => file.leadSource).filter(Boolean));
  sources.forEach((source) => tags.push(source));
  if (contact.files.some((file) => file.isReferral)) {
    const from = contact.files.find((file) => file.referralSource)?.referralSource;
    tags.push(from ? `Referral · ${from}` : "Referral");
  }
  if (contact.files.some((file) => file.isRelocation)) tags.push("Relocation");
  if (contact.petNames) tags.push(`Pet · ${contact.petNames}`);
  return tags;
}
