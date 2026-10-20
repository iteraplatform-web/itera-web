"use client";

import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { FileSignature, Flag } from "lucide-react";
import { useTransactionsStore } from "@/stores";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input, Select } from "@/components/ui/input";
import { money } from "@/lib/work/payout";
import { SectionLabel } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WorkInstructions, WorkStatusChip } from "@/components/workspace/work-ui";
import { milestonesReadiness } from "@/lib/work/readiness";
import { ExtendListingButton } from "@/components/workspace/extend-listing";
import type {
  AgreementRecord,
  MilestoneRecord,
  MilestoneStatus,
  TransactionFile,
} from "@/types";

const AGREEMENT_LABELS: Record<AgreementRecord["kind"], string> = {
  listing: "Listing agreement",
  buyer: "Buyer agency agreement",
  referral: "Referral agreement",
  relocation: "Relocation authorization",
};

const AGREEMENT_ABOUT: Record<AgreementRecord["kind"], string> = {
  listing: "Your contract to sell this house.",
  buyer: "Your contract to represent this buyer.",
  referral: "The fee you owe the agent who sent this client.",
  relocation: "The company's written okay before you go further.",
};

const AGREEMENT_STATUS_LABEL: Record<AgreementRecord["status"], string> = {
  draft: "Not sent",
  sent: "Waiting on signature",
  executed: "Signed",
};

const MILESTONE_GUIDE: Record<string, { about: string; results: string[]; note: string }> = {
  earnest_money: {
    about: "Confirm the buyer's deposit arrived. Title holds the money, not this app.",
    results: ["Received", "Waiting on receipt", "Not received"],
    note: "Example: Title confirmed the $7,500 wire",
  },
  title_search: {
    about: "The title company checks who owns the house and what is owed on it.",
    results: ["Clear", "Issues to clear", "Waiting on title"],
    note: "Example: Clear commitment, no liens",
  },
  inspection: {
    about: "The buyer's inspector checks the house during the option period.",
    results: ["Passed", "Credit negotiated", "Repairs agreed", "Buyer canceled"],
    note: "Example: Water heater and two outlets — $2,400 credit",
  },
  appraisal: {
    about: "The lender's appraiser says what the house is worth.",
    results: ["At contract price", "Below contract price", "Above contract price", "Waiting"],
    note: "Example: Appraised at $489,000",
  },
  financing_contingency: {
    about: "The buyer's loan is approved, or the deadline is released in writing.",
    results: ["Loan approved", "Still in underwriting", "Denied"],
    note: "Example: Waiting on the clear-to-close letter",
  },
  utilities_transfer: {
    about: "Power, water, and similar services switch on closing day.",
    results: ["Scheduled", "Confirmed", "Not needed"],
    note: "Example: Electric and water move on closing day",
  },
  final_walkthrough: {
    about: "A last look, usually within 48 hours of closing.",
    results: ["All good", "Repairs still open", "Buyer concerned"],
    note: "Example: Agreed repairs are done",
  },
  closing: {
    about: "Papers are signed, the sale is funded, and keys are handed over.",
    results: ["Funded and recorded", "Signed, waiting on funding", "Delayed"],
    note: "Example: Keys and garage remotes handed over",
  },
  post_close_followup: {
    about: "Thank the client, ask for a review, and set a reminder to check in.",
    results: ["Thank-you sent", "Review requested", "Done"],
    note: "Example: Review requested by text",
  },
  file_archive: {
    about: "The paperwork is complete and sent for the broker's review.",
    results: ["Sent to broker", "Broker approved", "Missing documents"],
    note: "Example: Commission recorded, file submitted",
  },
  buyer_preapproval: {
    about: "The lender's letter saying how much the buyer can borrow.",
    results: ["Letter on file", "Letter expired", "Waiting on lender"],
    note: "Example: Approved to $450,000, expires March 1",
  },
  earnest_money_buyer: {
    about: "The deposit was sent before the deadline. Title holds it, not this app.",
    results: ["Delivered", "Waiting on wire", "Not delivered"],
    note: "Example: $5,000 wired, receipt filed",
  },
  inspection_buyer: {
    about: "The inspector checks the house, then you send any repair request.",
    results: ["Passed", "Repairs requested", "Waived"],
    note: "Example: Repair request sent before the deadline",
  },
  appraisal_buyer: {
    about: "The lender's appraiser says what the house is worth.",
    results: ["At contract price", "Below contract price", "Above contract price", "Waiting"],
    note: "Example: $8,000 under price — buyer covering the gap",
  },
  title_review_buyer: {
    about: "You and the buyer read the title report for problems.",
    results: ["Clear", "Exceptions to review", "Waiting"],
    note: "Example: Easement reviewed with the buyer",
  },
  financing_buyer: {
    about: "The lender says the loan is ready to close.",
    results: ["Clear to close", "Still in underwriting", "Denied"],
    note: "Example: Cash to close sent to the buyer",
  },
  insurance_buyer: {
    about: "A homeowners policy is chosen and sent to the lender.",
    results: ["Policy bound", "Quotes in progress", "Waiting"],
    note: "Example: Binder sent to the lender",
  },
  final_walkthrough_buyer: {
    about: "A last look, usually within 48 hours of closing.",
    results: ["All good", "Repairs still open", "Buyer concerned"],
    note: "Example: Agreed repairs are done",
  },
  closing_buyer: {
    about: "Papers are signed and the buyer gets the keys.",
    results: ["Keys received", "Signed, waiting on funding", "Delayed"],
    note: "Example: Cash to close wired, keys collected",
  },
  post_close_followup_buyer: {
    about: "Thank the client, ask for a review, and set a reminder to check in.",
    results: ["Thank-you sent", "Review requested", "Done"],
    note: "Example: Review requested by text",
  },
};

const FALLBACK_GUIDE = {
  about: "Record where this step stands.",
  results: ["Done", "Waiting", "Problem", "Not needed"],
  note: "Add the detail the next person would need",
};

export function MilestonesSection({ file }: { file: TransactionFile }) {
  const updateMilestone = useTransactionsStore((s) => s.updateMilestone);
  const updateAgreement = useTransactionsStore((s) => s.updateAgreement);
  const readiness = milestonesReadiness(file.milestones);

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <SectionLabel icon={FileSignature}>Agreements</SectionLabel>
          {file.side === "listing" && <ExtendListingButton file={file} />}
        </div>
        <WorkInstructions
          title="Write down each contract. Signing happens outside this app."
          steps={[
            "Fill in the price, your percent, and the start and end dates",
            "Mark it when you send it, then again when it is signed",
            "Put the signed PDF on the Documents page",
          ]}
          externalNote="Signatures are collected in your usual signing tool. This page only keeps the record."
        />
        <div className="space-y-4">
          {file.agreements.map((a) => (
            <AgreementCard
              key={a.id}
              file={file}
              agreement={a}
              onSave={(updates) => updateAgreement(file.id, a.id, updates)}
            />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <SectionLabel icon={Flag}>Transaction milestones</SectionLabel>
          <WorkStatusChip status={readiness} />
        </div>
        <WorkInstructions
          title="Check off each step from the deposit to closing."
          steps={[
            "Set a status so you can see what is done",
            "Pick a result so the next person knows what happened",
            "Use the note for a dollar amount, a date, or who you called",
          ]}
          externalNote="Wires and loan payments stay with title and the lender. Record that they happened."
        />
        <div className="space-y-3">
          {file.milestones.map((m, index) => (
            <MilestoneCard
              key={m.id}
              step={index + 1}
              total={file.milestones.length}
              milestone={m}
              onSave={(updates) => updateMilestone(file.id, m.id, updates)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function AgreementCard({
  file,
  agreement,
  onSave,
}: {
  file: TransactionFile;
  agreement: AgreementRecord;
  onSave: (updates: Partial<AgreementRecord>) => void;
}) {
  const hasAcceptedOffer = file.offers.some((offer) => offer.status === "accepted");
  const shown = shownAgreement(file, agreement, hasAcceptedOffer);
  const shownKey = [
    shown.listPrice,
    shown.commissionRate,
    shown.referralPercentage,
    shown.status,
    shown.termStart,
    shown.termEnd,
    shown.notes,
  ].join("|");
  const [draft, setDraft] = useState(shown);
  const [confirm, setConfirm] = useState<string | null>(null);
  useEffect(() => {
    setDraft(shown);
    // shownKey already covers the fields that should refresh this card.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shownKey]);

  return (
    <div className="rounded-2xl border border-hairline p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-[14px] font-semibold text-ink-900">{AGREEMENT_LABELS[agreement.kind]}</p>
          <p className="mt-0.5 text-[13px] leading-relaxed text-ink-500">{AGREEMENT_ABOUT[agreement.kind]}</p>
        </div>
        <Badge
          variant={
            draft.status === "executed" ? "green" : draft.status === "sent" ? "amber" : "gray"
          }
        >
          {AGREEMENT_STATUS_LABEL[draft.status]}
        </Badge>
      </div>
      <div className="space-y-3">
        {(agreement.kind === "listing" || agreement.kind === "buyer") && (
          <div className="grid items-start gap-3 sm:grid-cols-2">
            {agreement.kind === "listing" && (
              <Input
                id={`${agreement.id}-price`}
                label={hasAcceptedOffer ? "Sale price" : "List price"}
                type="number"
                leading="$"
                placeholder="450000"
                value={draft.listPrice || ""}
                onChange={(e) => setDraft({ ...draft, listPrice: Number(e.target.value) })}
                hint="Also updates the Money page."
              />
            )}
            <Input
              id={`${agreement.id}-comm`}
              label="Your commission %"
              type="number"
              trailing="%"
              placeholder="3"
              value={draft.commissionRate ? +(draft.commissionRate * 100).toFixed(2) : ""}
              onChange={(e) =>
                setDraft({ ...draft, commissionRate: Number(e.target.value) / 100 })
              }
              hint="Also updates the Money page."
            />
          </div>
        )}
        {agreement.kind === "referral" && (
          <div className="grid items-start gap-3 sm:grid-cols-2">
            <Input
              id={`${agreement.id}-ref`}
              label="Referral %"
              type="number"
              trailing="%"
              placeholder="25"
              value={draft.referralPercentage || ""}
              onChange={(e) => setDraft({ ...draft, referralPercentage: Number(e.target.value) })}
              hint="Comes off the top of your pay."
            />
          </div>
        )}
        {(agreement.kind === "listing" || agreement.kind === "buyer") && (
          <div className="grid items-start gap-3 sm:grid-cols-2">
            <Input
              id={`${agreement.id}-start`}
              label="Starts"
              type="date"
              value={toDateInput(draft.termStart)}
              onChange={(e) => setDraft({ ...draft, termStart: fromDateInput(e.target.value) })}
            />
            <Input
              id={`${agreement.id}-end`}
              label="Ends"
              type="date"
              value={toDateInput(draft.termEnd)}
              onChange={(e) => setDraft({ ...draft, termEnd: fromDateInput(e.target.value) })}
            />
          </div>
        )}
        <div className="grid items-start gap-3 sm:grid-cols-2">
          <Select
            id={`${agreement.id}-status`}
            label="Where it stands"
            value={draft.status}
            onChange={(e) =>
              setDraft({ ...draft, status: e.target.value as AgreementRecord["status"] })
            }
          >
            <option value="draft">Not sent</option>
            <option value="sent">Waiting on signature</option>
            <option value="executed">Signed</option>
          </Select>
          <Input
            id={`${agreement.id}-notes`}
            label="Notes"
            placeholder={agreementNotePlaceholder(agreement.kind)}
            value={draft.notes}
            onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
          />
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        <Button
          size="sm"
          onClick={() => {
            const next =
              shown.kind === "listing" && !((draft.listPrice ?? 0) > 0)
                ? { ...draft, listPrice: shown.listPrice }
                : draft;
            if (next !== draft) setDraft(next);
            const message = agreementChangeMessage(shown, next, hasAcceptedOffer);
            if (message) {
              setConfirm(message);
              return;
            }
            onSave(next);
          }}
        >
          Save
        </Button>
      </div>
      <ConfirmDialog
        open={confirm !== null}
        title="Save these money terms?"
        message={confirm ?? ""}
        confirmLabel="Save"
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          onSave(
            shown.kind === "listing" && !((draft.listPrice ?? 0) > 0)
              ? { ...draft, listPrice: shown.listPrice }
              : draft
          );
          setConfirm(null);
        }}
      />
    </div>
  );
}

function agreementNotePlaceholder(kind: AgreementRecord["kind"]): string {
  if (kind === "referral") return "Who sent this client, and any fee notes";
  if (kind === "relocation") return "Company name, and whether they approved the move";
  if (kind === "listing") return "Example: 6-month term, seller wants a Saturday open house";
  return "Example: Buyer wants evening calls only";
}

function shownAgreement(file: TransactionFile, agreement: AgreementRecord, hasAcceptedOffer: boolean): AgreementRecord {
  if (!hasAcceptedOffer) return agreement;
  if (agreement.kind === "listing" && file.side === "listing") {
    return {
      ...agreement,
      listPrice: file.financials.listPrice,
      commissionRate: file.financials.commissionRate,
    };
  }
  if (agreement.kind === "buyer" && file.side === "buying") {
    return { ...agreement, commissionRate: file.financials.commissionRate };
  }
  return agreement;
}

function agreementChangeMessage(shown: AgreementRecord, draft: AgreementRecord, hasAcceptedOffer: boolean) {
  const lines: string[] = [];
  if (shown.kind === "listing" && (draft.listPrice || 0) !== (shown.listPrice || 0) && (draft.listPrice || 0) > 0) {
    lines.push(
      hasAcceptedOffer
        ? `Change the sale price from ${money(shown.listPrice || 0)} to ${money(draft.listPrice || 0)}. The Money page and the accepted offer will use this price too.`
        : `Save the list price as ${money(draft.listPrice || 0)}. The Money page will show this price too.`
    );
  }
  if (
    (shown.kind === "listing" || shown.kind === "buyer") &&
    Math.round((draft.commissionRate || 0) * 10000) !== Math.round((shown.commissionRate || 0) * 10000)
  ) {
    const from = shown.commissionRate ? `${+(shown.commissionRate * 100).toFixed(2)}%` : "0%";
    const to = draft.commissionRate ? `${+(draft.commissionRate * 100).toFixed(2)}%` : "0%";
    lines.push(`Change your percent from ${from} to ${to}. The Money page will use this percent too, and your pay will be recalculated.`);
  }
  if (shown.kind === "referral" && (draft.referralPercentage || 0) !== (shown.referralPercentage || 0)) {
    lines.push(
      `Change the referral fee from ${shown.referralPercentage || 0}% to ${draft.referralPercentage || 0}%. This comes off the top of your pay.`
    );
  }
  return lines.join(" ");
}

/** Calendar date for an `<input type="date">`, in the agent's local day. */
function toDateInput(value?: string): string {
  if (!value) return "";
  const date = parseISO(value);
  return Number.isNaN(date.getTime()) ? "" : format(date, "yyyy-MM-dd");
}

/** Noon local time, so the calendar day does not slip across midnight UTC. */
function fromDateInput(value: string): string | undefined {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day, 12, 0, 0).toISOString();
}

function milestoneGuide(taskId: string) {
  return MILESTONE_GUIDE[taskId] ?? FALLBACK_GUIDE;
}

function resultChoices(taskId: string, current?: string, saved?: string): string[] {
  const results = [...milestoneGuide(taskId).results];
  for (const extra of [saved, current]) {
    if (extra && !results.includes(extra)) results.unshift(extra);
  }
  return results;
}

function MilestoneCard({
  step,
  total,
  milestone,
  onSave,
}: {
  step: number;
  total: number;
  milestone: MilestoneRecord;
  onSave: (updates: Partial<MilestoneRecord>) => void;
}) {
  const [draft, setDraft] = useState(milestone);
  const guide = milestoneGuide(milestone.taskId);
  const results = resultChoices(milestone.taskId, draft.outcome, milestone.outcome);

  return (
    <div className="rounded-xl border border-hairline px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12px] font-medium text-ink-400">
            Step {step} of {total}
          </p>
          <p className="text-[14px] font-semibold text-ink-900">{milestone.title}</p>
          <p className="mt-0.5 text-[13px] leading-relaxed text-ink-500">{guide.about}</p>
        </div>
        <div className="w-full sm:w-52">
          <Select
            id={`${milestone.id}-status`}
            label="Status"
            value={draft.status}
            onChange={(e) => setDraft({ ...draft, status: e.target.value as MilestoneStatus })}
          >
            <option value="not_started">Not started</option>
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In progress</option>
            <option value="complete">Complete</option>
            <option value="waived">Not needed</option>
          </Select>
        </div>
      </div>
      <div className="mt-3 grid items-start gap-3 sm:grid-cols-2">
        <Select
          id={`${milestone.id}-outcome`}
          label="Result"
          value={draft.outcome || ""}
          onChange={(e) => setDraft({ ...draft, outcome: e.target.value })}
        >
          <option value="">Choose a result</option>
          {results.map((result) => (
            <option key={result} value={result}>
              {result}
            </option>
          ))}
        </Select>
        <Input
          id={`${milestone.id}-notes`}
          label="Note"
          placeholder={guide.note}
          value={draft.notes}
          onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
        />
      </div>
      <div className="mt-3 flex justify-end">
        <Button size="sm" variant="secondary" onClick={() => onSave(draft)}>
          Update
        </Button>
      </div>
    </div>
  );
}
