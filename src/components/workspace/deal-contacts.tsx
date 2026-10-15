"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Phone, Users } from "lucide-react";
import { useTransactionsStore } from "@/stores";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { sectionHref } from "@/components/workspace/workspace-sidebar";
import { emptyDealContact, emptyDealContacts } from "@/lib/work/defaults";
import { emailError, formatPhone, formatPhoneTyping, phoneError } from "@/lib/utils/contact";
import type { DealContact, DealContacts, TransactionFile } from "@/types";

const KEYS = ["otherAgent", "lender", "closingRep"] as const;

function otherAgentRole(file: TransactionFile): string {
  return file.side === "listing" ? "Buyer's agent" : "Listing agent";
}

function roleFor(file: TransactionFile, key: (typeof KEYS)[number]): { role: string; org: string } {
  if (key === "otherAgent") {
    return { role: otherAgentRole(file), org: "Brokerage" };
  }
  if (key === "lender") return { role: "Lender", org: "Company" };
  return { role: "Closing rep", org: "Title company" };
}

function filled(contact: DealContact): boolean {
  return [contact.name, contact.phone, contact.email, contact.organization].some((v) => v.trim());
}

function contactProblem(contact: DealContact, role: string): string | undefined {
  if (!filled(contact)) return undefined;
  if (!contact.name.trim()) return `Add a name for the ${role.toLowerCase()}, or clear the other boxes.`;
  if (contact.phone.trim()) {
    const problem = phoneError(contact.phone);
    if (problem && problem !== "Phone number is required.") return `${role}: ${problem}`;
  }
  if (contact.email.trim()) {
    const problem = emailError(contact.email);
    if (problem && problem !== "Email address is required.") return `${role}: ${problem}`;
  }
  return undefined;
}

function clean(contact: DealContact): DealContact {
  return {
    name: contact.name.trim(),
    phone: contact.phone.trim() ? formatPhone(contact.phone) : "",
    email: contact.email.trim(),
    organization: contact.organization.trim(),
  };
}

function dial(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits ? `tel:${digits}` : "";
}

export function DealContactsCard({ file, embedded = false }: { file: TransactionFile; embedded?: boolean }) {
  const updateDealContacts = useTransactionsStore((s) => s.updateDealContacts);
  const contacts = file.dealContacts ?? emptyDealContacts();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DealContacts>(contacts);
  const [error, setError] = useState("");

  const startEdit = () => {
    setDraft({
      otherAgent: { ...emptyDealContact(), ...contacts.otherAgent },
      lender: { ...emptyDealContact(), ...contacts.lender },
      closingRep: { ...emptyDealContact(), ...contacts.closingRep },
    });
    setError("");
    setOpen(true);
  };

  const patch = (key: (typeof KEYS)[number], field: keyof DealContact, value: string) => {
    setDraft((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
    setError("");
  };

  const save = () => {
    const next: DealContacts = {
      otherAgent: clean(draft.otherAgent),
      lender: clean(draft.lender),
      closingRep: clean(draft.closingRep),
    };
    for (const key of KEYS) {
      const problem = contactProblem(next[key], roleFor(file, key).role);
      if (problem) {
        setError(problem);
        return;
      }
    }
    updateDealContacts(file.id, next);
    setOpen(false);
  };

  return (
    <section className={embedded ? "border-t border-hairline" : "overflow-hidden rounded-2xl border border-hairline bg-surface shadow-sm"}>
      <header className="flex items-center justify-between gap-3 border-b border-hairline px-5 py-4">
        <h2 className="flex items-center gap-2.5 text-[17px] font-semibold text-ink-950">
          <Users className="h-5 w-5 text-ink-500" />
          People on this deal
        </h2>
        <Button size="xs" variant="secondary" onClick={startEdit}>
          Edit contacts
        </Button>
      </header>
      <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-4">
        <ClientCard file={file} />
        {KEYS.map((key) => (
          <PersonCard key={key} role={roleFor(file, key).role} contact={contacts[key]} />
        ))}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        size="lg"
        title="People on this deal"
        description={
          file.side === "listing"
            ? "Your client stays as entered on the file. Add the buyer's agent, the lender, and the closing rep."
            : "Your client stays as entered on the file. Add the listing agent, the lender, and the closing rep."
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save}>Save contacts</Button>
          </>
        }
      >
        <div className="space-y-6">
          {error && <p className="text-[14px] text-red-600">{error}</p>}
          {KEYS.map((key) => {
            const meta = roleFor(file, key);
            const person = draft[key];
            return (
              <div key={key} className="space-y-3">
                <p className="text-[14px] font-semibold text-ink-900">{meta.role}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input id={`${key}-name`} label="Name" value={person.name} onChange={(e) => patch(key, "name", e.target.value)} />
                  <Input
                    id={`${key}-phone`}
                    label="Phone"
                    value={person.phone}
                    onChange={(e) => patch(key, "phone", formatPhoneTyping(e.target.value, person.phone))}
                  />
                  <Input id={`${key}-email`} label="Email" value={person.email} onChange={(e) => patch(key, "email", e.target.value)} />
                  <Input
                    id={`${key}-org`}
                    label={meta.org}
                    value={person.organization}
                    onChange={(e) => patch(key, "organization", e.target.value)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Modal>
    </section>
  );
}

function ClientCard({ file }: { file: TransactionFile }) {
  return (
    <article className="rounded-xl border border-hairline bg-canvas px-4 py-3">
      <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-500">Your client</p>
      <p className="mt-1 text-[15px] font-semibold text-ink-950">{file.clientName || "No name yet"}</p>
      {file.coClientName && <p className="text-[13px] text-ink-600">With {file.coClientName}</p>}
      <ContactLines phone={file.phone} email={file.email} organization="" />
      <Link href={sectionHref(file.id, "client_profile")} className="mt-2 inline-block text-[13px] font-semibold text-itera-700">
        Client profile
      </Link>
    </article>
  );
}

function PersonCard({ role, contact }: { role: string; contact: DealContact }) {
  return (
    <article className="rounded-xl border border-hairline bg-canvas px-4 py-3">
      <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-500">{role}</p>
      {filled(contact) ? (
        <>
          <p className="mt-1 text-[15px] font-semibold text-ink-950">{contact.name}</p>
          <ContactLines phone={contact.phone} email={contact.email} organization={contact.organization} />
        </>
      ) : (
        <p className="mt-1 text-[14px] text-ink-500">Not added yet</p>
      )}
    </article>
  );
}

function ContactLines({ phone, email, organization }: { phone: string; email: string; organization: string }) {
  const call = dial(phone);
  return (
    <div className="mt-1 space-y-0.5 text-[13px] text-ink-600">
      {organization && <p>{organization}</p>}
      {phone &&
        (call ? (
          <a href={call} className="flex items-center gap-1.5 font-medium text-ink-800 hover:text-itera-700">
            <Phone className="h-3.5 w-3.5" />
            {phone}
          </a>
        ) : (
          <p>{phone}</p>
        ))}
      {email && (
        <a href={`mailto:${email}`} className="flex items-center gap-1.5 font-medium text-ink-800 hover:text-itera-700">
          <Mail className="h-3.5 w-3.5" />
          {email}
        </a>
      )}
    </div>
  );
}
