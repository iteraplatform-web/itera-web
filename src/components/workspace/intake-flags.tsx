"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useTransactionsStore } from "@/stores";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";
import type { TransactionFile } from "@/types";

/**
 * The answers that shaped this file's checklist. Circumstances change —
 * a client mentions a referral a week in — so these stay editable, and saving
 * adds or removes the tasks and documents that depend on them.
 */
export function IntakeFlags({ file }: { file: TransactionFile }) {
  const updateIntakeFlags = useTransactionsStore((s) => s.updateIntakeFlags);
  const [isReferral, setIsReferral] = useState(file.isReferral);
  const [isRelocation, setIsRelocation] = useState(file.isRelocation);
  const [pre1978, setPre1978] = useState(Boolean(file.builtBefore1978));
  const [pct, setPct] = useState(String(file.referralPercentage ?? ""));
  const [source, setSource] = useState(file.referralSource ?? "");

  const dirty =
    isReferral !== file.isReferral ||
    isRelocation !== file.isRelocation ||
    (file.side === "listing" && pre1978 !== Boolean(file.builtBefore1978)) ||
    pct !== String(file.referralPercentage ?? "") ||
    source !== (file.referralSource ?? "");

  return (
    <section className="rounded-2xl border border-hairline bg-surface p-5 sm:p-6">
      <h3 className="flex items-center gap-2 text-[18px] font-semibold text-ink-950">
        <Sparkles className="h-5 w-5 text-violet-600" />
        Answers that shape the checklist
      </h3>
      <p className="mt-1 max-w-xl text-[15px] text-ink-500">
        Change one of these and ITERA adds or removes the matching tasks and documents. Work already started is never removed.
      </p>

      <div className="mt-5 space-y-4">
        <YesNoRow label="Is this a referral?" hint="Adds the referral agreement and deducts the fee from your payout." value={isReferral} onChange={setIsReferral} />
        {isReferral && (
          <div className="grid gap-4 rounded-xl bg-violet-50/60 p-4 sm:grid-cols-2">
            <Input id="if-src" label="Referred by" value={source} onChange={(e) => setSource(e.target.value)} placeholder="Anchor Relocation" />
            <Input id="if-pct" label="Referral fee" type="number" trailing="%" value={pct} onChange={(e) => setPct(e.target.value)} placeholder="25" />
          </div>
        )}
        <YesNoRow label="Is this a relocation?" hint="Adds the relocation company's authorization." value={isRelocation} onChange={setIsRelocation} />
        {file.side === "listing" && (
          <YesNoRow label="Built before 1978?" hint="Federal law requires the lead-based paint disclosure." value={pre1978} onChange={setPre1978} />
        )}
      </div>

      <div className="mt-5 flex justify-end">
        <Button
          disabled={!dirty}
          onClick={() =>
            updateIntakeFlags(file.id, {
              isReferral,
              isRelocation,
              builtBefore1978: file.side === "listing" ? pre1978 : undefined,
              referralPercentage: isReferral && pct ? Number(pct) : undefined,
              referralSource: isReferral ? source : undefined,
            })
          }
        >
          Save and update checklist
        </Button>
      </div>
    </section>
  );
}

function YesNoRow({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-canvas px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-[16px] font-medium text-ink-900">{label}</p>
        <p className="text-[14px] text-ink-500">{hint}</p>
      </div>
      <div className="inline-flex shrink-0 rounded-xl bg-ink-100 p-1">
        {[true, false].map((v) => (
          <button
            key={String(v)}
            type="button"
            onClick={() => onChange(v)}
            aria-pressed={value === v}
            className={cn(
              "rounded-lg px-5 py-2 text-[15px] font-semibold transition-all",
              value === v ? (v ? "bg-ink-950 text-white" : "bg-surface text-ink-900 shadow-xs") : "text-ink-600"
            )}
          >
            {v ? "Yes" : "No"}
          </button>
        ))}
      </div>
    </div>
  );
}
