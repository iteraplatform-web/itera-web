"use client";

import { useState } from "react";
import {
  Check,
  Gift,
  HandCoins,
  Plus,
  Receipt,
  TrendingUp,
  X,
} from "lucide-react";
import { useAuthStore, useTransactionsStore } from "@/stores";
import { useFocusTarget } from "@/hooks/use-focus-target";
import { calculatePayout, money } from "@/lib/work/payout";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataRow, EmptyState } from "@/components/ui/misc";
import { SectionLabel } from "@/components/ui/card";
import { formatDate } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";
import {
  FINANCING_LABELS,
  type FinancingType,
  type Offer,
  type TransactionFile,
} from "@/types";

/** Keeps the sign outside the currency symbol: -$14,000, not $-14,000. */


export function FinancialsSection({ file, focus }: { file: TransactionFile; focus?: string }) {
  const user = useAuthStore((s) => s.user);
  useFocusTarget(focus);
  const updateFinancials = useTransactionsStore((s) => s.updateFinancials);
  const addOffer = useTransactionsStore((s) => s.addOffer);
  const setOfferStatus = useTransactionsStore((s) => s.setOfferStatus);
  const [showOfferModal, setShowOfferModal] = useState(false);

  const { financials } = file;
  const payout = calculatePayout(file, user);

  return (
    <div className="space-y-7">
      {/* ── Deal basics ───────────────────────────────────────── */}
      <section>
        <SectionLabel icon={Receipt}>Deal figures</SectionLabel>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            id="listPrice"
            label={file.side === "listing" ? "List / sale price" : "Target price"}
            type="number"
            leading="$"
            value={financials.listPrice || ""}
            onChange={(e) => updateFinancials(file.id, { listPrice: Number(e.target.value) })}
            placeholder="0"
          />
          <Input
            id="commissionRate"
            label="Commission rate"
            type="number"
            step="0.05"
            trailing="%"
            /* Stored as a decimal, entered as a percentage — agents think in
               percentages, so the field speaks their language. */
            value={financials.commissionRate ? +(financials.commissionRate * 100).toFixed(2) : ""}
            onChange={(e) =>
              updateFinancials(file.id, { commissionRate: Number(e.target.value) / 100 })
            }
            placeholder="3"
            hint="Typically 2.5% to 3%"
          />
        </div>
      </section>

      {/* ── Earnest money ─────────────────────────────────────── */}
      <section data-focus="earnest">
        <SectionLabel icon={HandCoins}>Earnest money</SectionLabel>
        <div
          className={cn(
            "flex flex-wrap items-center justify-between gap-4 rounded-2xl border px-5 py-4",
            financials.earnestMoneyStatus === "received"
              ? "border-emerald-200 bg-emerald-50/50"
              : "border-amber-200 bg-amber-50/50"
          )}
        >
          <div>
            <p className="tnum text-[26px] font-bold leading-none tracking-[-0.02em] text-ink-950">
              {money(financials.earnestMoney)}
            </p>
            <p className="mt-1.5 text-[13px] text-ink-500">
              {financials.earnestMoneyStatus === "received"
                ? "Verified in escrow"
                : "Not yet confirmed — later tasks stay locked until it is"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Input
              id="earnestAmount"
              type="number"
              leading="$"
              value={financials.earnestMoney || ""}
              onChange={(e) => updateFinancials(file.id, { earnestMoney: Number(e.target.value) })}
              className="w-32"
            />
            <button
              onClick={() =>
                updateFinancials(file.id, {
                  earnestMoneyStatus:
                    financials.earnestMoneyStatus === "received" ? "pending" : "received",
                })
              }
              className={cn(
                "h-[42px] rounded-xl px-3.5 text-[14px] font-semibold transition-colors",
                financials.earnestMoneyStatus === "received"
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-amber-500 text-white hover:bg-amber-600"
              )}
            >
              {financials.earnestMoneyStatus === "received" ? "Received" : "Pending"}
            </button>
          </div>
        </div>
      </section>

      {/* ── Commission calculator ─────────────────────────────── */}
      <section data-focus="commission">
        <SectionLabel icon={TrendingUp}>What you will be paid</SectionLabel>
        <div className="overflow-hidden rounded-2xl border border-hairline">
          <div className="divide-y divide-hairline bg-surface px-5">
            <PayRow
              label={`Gross commission — ${payout.ratePct.toFixed(2)}% of ${money(payout.price)}`}
              value={money(payout.gross)}
            />
            {payout.referralFee > 0 && (
              <PayRow
                label={
                  <span className="flex items-center gap-1.5">
                    <Gift className="h-4 w-4 text-ink-600" />
                    Referral fee — {payout.referralPct}% to {file.referralSource || "referring broker"}
                  </span>
                }
                value={`−${money(payout.referralFee)}`}
                tone="deduct"
              />
            )}
            <PayRow
              label={`Brokerage share — you keep ${payout.agentSplitPct}%`}
              value={`−${money(payout.brokerageShare)}`}
              tone="deduct"
            />
            <PayRow label="Transaction fee" value={`−${money(payout.transactionFee)}`} tone="deduct" />
          </div>

          <div className="border-t border-hairline bg-ink-950 px-5 py-4">
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-[15px] font-medium text-ink-200">Your take-home</span>
              <span className="tnum text-[26px] font-bold tracking-[-0.02em] text-white">{money(payout.net)}</span>
            </div>
            <p className="mt-1.5 text-[13px] text-ink-300">
              Split and fee come from your terms in Settings. Paid out after closing funds.
            </p>
          </div>
        </div>
      </section>

      {/* ── Offers ────────────────────────────────────────────── */}
      <section data-focus="offers">
        <SectionLabel
          icon={Receipt}
          action={
            <Button size="xs" variant="secondary" onClick={() => setShowOfferModal(true)}>
              <Plus className="h-3 w-3" />
              Log an offer
            </Button>
          }
        >
          Offers {file.offers.length > 0 && `(${file.offers.length})`}
        </SectionLabel>

        {file.offers.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No offers yet"
            description="Log each one as it comes in — they sit side by side rather than scattered across email."
            action={
              <Button size="sm" variant="secondary" onClick={() => setShowOfferModal(true)}>
                <Plus className="h-3.5 w-3.5" />
                Log the first offer
              </Button>
            }
          />
        ) : (
          <ul className="space-y-2.5">
            {[...file.offers]
              .sort((a, b) => b.amount - a.amount)
              .map((offer) => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  listPrice={file.listPrice}
                  onAccept={() => setOfferStatus(file.id, offer.id, "accepted")}
                  onReject={() => setOfferStatus(file.id, offer.id, "rejected")}
                />
              ))}
          </ul>
        )}
      </section>

      <LogOfferModal
        open={showOfferModal}
        onClose={() => setShowOfferModal(false)}
        suggestedAmount={file.listPrice}
        onSubmit={(offer) => {
          addOffer(file.id, offer);
          setShowOfferModal(false);
        }}
      />
    </div>
  );
}

function OfferCard({
  offer,
  listPrice,
  onAccept,
  onReject,
}: {
  offer: Offer;
  listPrice: number;
  onAccept: () => void;
  onReject: () => void;
}) {
  const delta = listPrice > 0 ? offer.amount - listPrice : 0;
  const isPending = offer.status === "pending";

  const statusVariant = {
    accepted: "green",
    rejected: "gray",
    pending: "amber",
    countered: "default",
  }[offer.status] as "green" | "gray" | "amber" | "default";

  return (
    <li
      className={cn(
        "rounded-2xl border p-4 transition-colors",
        offer.status === "accepted"
          ? "border-emerald-200 bg-emerald-50/40"
          : offer.status === "rejected"
          ? "border-hairline bg-canvas/60 opacity-70"
          : "border-amber-200 bg-surface shadow-xs"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-baseline gap-2.5">
            <span className="tnum text-[20px] font-bold tracking-[-0.02em] text-ink-950">
              ${offer.amount.toLocaleString()}
            </span>
            {delta !== 0 && (
              <span
                className={cn(
                  "tnum text-[13px] font-semibold",
                  delta > 0 ? "text-emerald-600" : "text-red-600"
                )}
              >
                {delta > 0 ? "+" : ""}
                {money(delta)} vs list
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[14px] text-ink-600">{offer.buyerName}</p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Badge variant={statusVariant} dot>
            {offer.status[0].toUpperCase() + offer.status.slice(1)}
          </Badge>
          {isPending && (
            <>
              <Button size="xs" variant="success" onClick={onAccept}>
                <Check className="h-3 w-3" />
                Accept
              </Button>
              <Button size="xs" variant="secondary" onClick={onReject}>
                <X className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
      </div>

      <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 border-t border-hairline pt-3 text-[13px]">
        <Fact label="Financing" value={FINANCING_LABELS[offer.financing]} />
        {offer.earnestMoney ? (
          <Fact label="Earnest" value={money(offer.earnestMoney)} />
        ) : null}
        {offer.proposedClosingDate && (
          <Fact label="Closing" value={formatDate(offer.proposedClosingDate, "MMM d")} />
        )}
        <Fact label="Received" value={formatDate(offer.receivedAt, "MMM d")} />
      </dl>

      {offer.contingencies && (
        <p className="mt-2 text-[13px] text-ink-500">
          <span className="font-medium text-ink-700">Contingencies:</span> {offer.contingencies}
        </p>
      )}
      {offer.notes && (
        <p className="mt-1.5 text-[13px] italic text-ink-500">{offer.notes}</p>
      )}
    </li>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <dt className="text-ink-500">{label}</dt>
      <dd className="font-semibold text-ink-800">{value}</dd>
    </div>
  );
}

function LogOfferModal({
  open,
  onClose,
  suggestedAmount,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  suggestedAmount: number;
  onSubmit: (offer: Omit<Offer, "id" | "receivedAt" | "status">) => void;
}) {
  const [buyerName, setBuyerName] = useState("");
  const [amount, setAmount] = useState("");
  const [earnestMoney, setEarnestMoney] = useState("");
  const [financing, setFinancing] = useState<FinancingType>("conventional");
  const [contingencies, setContingencies] = useState("Inspection, Financing, Appraisal");
  const [notes, setNotes] = useState("");

  const reset = () => {
    setBuyerName("");
    setAmount("");
    setEarnestMoney("");
    setFinancing("conventional");
    setContingencies("Inspection, Financing, Appraisal");
    setNotes("");
  };

  const submit = () => {
    if (!buyerName.trim() || !amount) return;
    onSubmit({
      buyerName: buyerName.trim(),
      amount: Number(amount),
      earnestMoney: earnestMoney ? Number(earnestMoney) : undefined,
      financing,
      contingencies: contingencies.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    reset();
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Log an offer"
      description="Every offer sits alongside the others, so nothing is tracked in email."
      footer={
        <>
          <Button
            variant="secondary"
            onClick={() => {
              reset();
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button onClick={submit} disabled={!buyerName.trim() || !amount}>
            Log offer
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          id="buyerName"
          label="Buyer or buyer's agent"
          value={buyerName}
          onChange={(e) => setBuyerName(e.target.value)}
          placeholder="Rivera Household"
          autoFocus
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="offerAmount"
            label="Offer amount"
            type="number"
            leading="$"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={String(suggestedAmount || 450000)}
          />
          <Input
            id="offerEarnest"
            label="Earnest money"
            type="number"
            leading="$"
            value={earnestMoney}
            onChange={(e) => setEarnestMoney(e.target.value)}
            placeholder="5000"
          />
        </div>
        <Select
          id="financing"
          label="Financing"
          value={financing}
          onChange={(e) => setFinancing(e.target.value as FinancingType)}
        >
          {Object.entries(FINANCING_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </Select>
        <Input
          id="contingencies"
          label="Contingencies"
          value={contingencies}
          onChange={(e) => setContingencies(e.target.value)}
        />
        <Textarea
          id="offerNotes"
          label="Notes"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Strong lender letter, flexible on possession."
        />
      </div>
    </Modal>
  );
}

function PayRow({
  label,
  value,
  tone = "plain",
}: {
  label: React.ReactNode;
  value: string;
  tone?: "plain" | "deduct";
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3">
      <span className="text-[15px] text-ink-600">{label}</span>
      <span className={cn("tnum text-[16px] font-semibold", tone === "deduct" ? "text-ink-600" : "text-ink-950")}>
        {value}
      </span>
    </div>
  );
}
