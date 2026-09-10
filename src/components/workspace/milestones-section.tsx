"use client";

import { useState } from "react";
import { FileSignature, Flag } from "lucide-react";
import { useTransactionsStore } from "@/stores";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { SectionLabel } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WorkInstructions, WorkStatusChip } from "@/components/workspace/work-ui";
import { milestonesReadiness } from "@/lib/work/readiness";
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

export function MilestonesSection({ file }: { file: TransactionFile }) {
  const updateMilestone = useTransactionsStore((s) => s.updateMilestone);
  const updateAgreement = useTransactionsStore((s) => s.updateAgreement);
  const readiness = milestonesReadiness(file.milestones);

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <SectionLabel icon={FileSignature}>Agreements</SectionLabel>
        </div>
        <WorkInstructions
          title="Log agreement terms on the file"
          steps={[
            "Record price, term, and commission (or referral split)",
            "Mark when the agreement was sent and executed",
            "File the signed copy under Documents",
          ]}
          externalNote="E-sign happens in your existing signing tool — ITERA keeps the record."
        />
        <div className="space-y-4">
          {file.agreements.map((a) => (
            <AgreementCard
              key={a.id}
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
          title="Track under-contract and closing work here"
          steps={[
            "Update status as inspection, appraisal, title, and financing move",
            "Capture outcomes and notes for the activity history",
            "Payments and wires stay with title/escrow — record confirmation only",
          ]}
          externalNote="Earnest wires and lender payments are not processed in ITERA."
        />
        <div className="space-y-3">
          {file.milestones.map((m) => (
            <MilestoneCard
              key={m.id}
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
  agreement,
  onSave,
}: {
  agreement: AgreementRecord;
  onSave: (updates: Partial<AgreementRecord>) => void;
}) {
  const [draft, setDraft] = useState(agreement);

  return (
    <div className="rounded-2xl border border-hairline p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-[14px] font-semibold text-ink-900">{AGREEMENT_LABELS[agreement.kind]}</p>
        <Badge
          variant={
            draft.status === "executed" ? "green" : draft.status === "sent" ? "amber" : "gray"
          }
        >
          {draft.status}
        </Badge>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {(agreement.kind === "listing" || agreement.kind === "buyer") && (
          <>
            {agreement.kind === "listing" && (
              <Input
                id={`${agreement.id}-price`}
                label="List price"
                type="number"
                leading="$"
                value={draft.listPrice || ""}
                onChange={(e) => setDraft({ ...draft, listPrice: Number(e.target.value) })}
              />
            )}
            <Input
              id={`${agreement.id}-comm`}
              label="Commission %"
              type="number"
              trailing="%"
              value={draft.commissionRate ? +(draft.commissionRate * 100).toFixed(2) : ""}
              onChange={(e) =>
                setDraft({ ...draft, commissionRate: Number(e.target.value) / 100 })
              }
            />
          </>
        )}
        {agreement.kind === "referral" && (
          <Input
            id={`${agreement.id}-ref`}
            label="Referral %"
            type="number"
            trailing="%"
            value={draft.referralPercentage || ""}
            onChange={(e) => setDraft({ ...draft, referralPercentage: Number(e.target.value) })}
          />
        )}
        <Select
          id={`${agreement.id}-status`}
          label="Status"
          value={draft.status}
          onChange={(e) =>
            setDraft({ ...draft, status: e.target.value as AgreementRecord["status"] })
          }
        >
          <option value="draft">Draft</option>
          <option value="sent">Sent for signature</option>
          <option value="executed">Executed</option>
        </Select>
        <Textarea
          id={`${agreement.id}-notes`}
          label="Notes"
          rows={2}
          className="sm:col-span-2"
          value={draft.notes}
          onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
        />
      </div>
      <div className="mt-3 flex justify-end">
        <Button size="sm" onClick={() => onSave(draft)}>
          Save
        </Button>
      </div>
    </div>
  );
}

function MilestoneCard({
  milestone,
  onSave,
}: {
  milestone: MilestoneRecord;
  onSave: (updates: Partial<MilestoneRecord>) => void;
}) {
  const [draft, setDraft] = useState(milestone);

  return (
    <div className="rounded-xl border border-hairline px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[14px] font-semibold text-ink-900">{milestone.title}</p>
        <Select
          value={draft.status}
          onChange={(e) => setDraft({ ...draft, status: e.target.value as MilestoneStatus })}
          className="w-40"
        >
          <option value="not_started">Not started</option>
          <option value="scheduled">Scheduled</option>
          <option value="in_progress">In progress</option>
          <option value="complete">Complete</option>
          <option value="waived">Waived</option>
        </Select>
      </div>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <Input
          id={`${milestone.id}-outcome`}
          label="Outcome"
          value={draft.outcome || ""}
          onChange={(e) => setDraft({ ...draft, outcome: e.target.value })}
        />
        <Input
          id={`${milestone.id}-notes`}
          label="Notes"
          value={draft.notes}
          onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
        />
      </div>
      <div className="mt-2 flex justify-end">
        <Button size="sm" variant="secondary" onClick={() => onSave(draft)}>
          Update
        </Button>
      </div>
    </div>
  );
}
