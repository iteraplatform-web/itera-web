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
  OFFER_STATUS_LABELS,
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
            label={file.side === "listing" ? "Selling agent" : "Buyer agent"}
            type="number"
            step="0.05"
            trailing="%"
            /* Stored as a decimal, entered as a percentage — agents think in
               percentages, so the field speaks their language. */
            value={financials.commissionRate ? +(financials.commissionRate * 100).toFixed(2) : ""}
            onChange={(e) =>
              updateFinancials(file.id, { commissionRate: Number(e.target.value) / 100 })
            }
            placeholder="2.5"
            hint={
              file.side === "listing"
                ? "Your pay. The buyer agent percent is in the split below."
                : "Your pay. The selling agent percent is in the split below."
            }
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

      {/* ── Client rebate ─────────────────────────────────────── */}
      <section data-focus="rebate">
        <SectionLabel icon={Gift}>Client rebate</SectionLabel>
        <div className="rounded-2xl border border-hairline bg-surface px-5 py-4">
          <p className="max-w-xl text-[14px] leading-relaxed text-ink-600">
            Money you give back to {file.clientName || "your client"} from your own pay.
            {file.side === "listing" ? " On a listing, that client is the seller." : " On a buyer file, that client is the buyer."}{" "}
            A seller concession is different. That is money the seller gives the buyer, and it is entered on the offer.
          </p>
          <div className="mt-4 max-w-xs">
            <Input
              id="rebate"
              label="Rebate amount"
              type="number"
              leading="$"
              min={0}
              value={financials.rebate || ""}
              onChange={(e) => {
                const next = Number(e.target.value);
                updateFinancials(file.id, { rebate: Number.isFinite(next) && next > 0 ? next : 0 });
              }}
              placeholder="0"
              hint="Comes out of your take-home below."
            />
          </div>
          {payout.rebate > 0 && payout.rebate > payout.beforeRebate && (
            <p className="mt-3 text-[14px] text-amber-800">
              This rebate is more than your pay on this file. Take-home is {money(0)}.
            </p>
          )}
        </div>
      </section>

      <PaySplit file={file} />

      {/* ── Commission calculator ─────────────────────────────── */}
      <section data-focus="commission">
        <SectionLabel icon={TrendingUp}>What you will be paid</SectionLabel>
        <div className="overflow-hidden rounded-2xl border border-hairline">
          <div className="divide-y divide-hairline bg-surface px-5">
            <PayRow
              label={`${file.side === "listing" ? "Selling agent" : "Buyer agent"} — ${payout.ratePct.toFixed(2)}% of ${money(payout.price)}`}
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
            {payout.rebate > 0 && (
              <PayRow
                label={`Client rebate — back to ${file.clientName || "your client"}`}
                value={`−${money(payout.rebate)}`}
                tone="deduct"
              />
            )}
          </div>

          <div className="border-t border-hairline bg-ink-950 px-5 py-4">
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-[15px] font-medium text-ink-200">Your take-home</span>
              <span className="tnum text-[26px] font-bold tracking-[-0.02em] text-white">{money(payout.net)}</span>
            </div>
            <p className="mt-1.5 text-[13px] text-ink-300">
              This is your side only. The brokerage split and fee come from Settings. Paid out after closing funds.
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
          <div className="space-y-5">
            {(
              [
                ["accepted", OFFER_STATUS_LABELS.accepted],
                ["countered", OFFER_STATUS_LABELS.countered],
                ["pending", OFFER_STATUS_LABELS.pending],
                ["rejected", OFFER_STATUS_LABELS.rejected],
              ] as const
            ).map(([status, title]) => {
              const group = file.offers.filter((offer) => offer.status === status);
              if (group.length === 0) return null;
              return (
                <div key={status}>
                  <p className="mb-2 text-[13px] font-semibold text-ink-500">{title}</p>
                  <ul className="space-y-2.5">
                    {[...group]
                      .sort((a, b) => b.amount - a.amount)
                      .map((offer) => (
                        <OfferCard
                          key={offer.id}
                          offer={offer}
                          listPrice={file.listPrice}
                          onAccept={() => setOfferStatus(file.id, offer.id, "accepted")}
                          onCounter={() => setOfferStatus(file.id, offer.id, "countered")}
                          onReject={() => setOfferStatus(file.id, offer.id, "rejected")}
                        />
                      ))}
                  </ul>
                </div>
              );
            })}
          </div>
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

function rateLabel(rate: number | undefined, amount: number) {
  if (!rate) return "";
  const pct = `${+(rate * 100).toFixed(2)}%`;
  return amount ? `${pct} · ${money(amount * rate)}` : pct;
}

/** The accepted offer sets the split. If none is accepted, the newest offer that names a rate does. */
function splitSource(file: TransactionFile) {
  const accepted = file.offers.find((offer) => offer.status === "accepted");
  if (accepted && (accepted.sellingAgentRate != null || accepted.buyerAgentRate != null)) return accepted;
  return [...file.offers]
    .sort((a, b) => +new Date(b.receivedAt) - +new Date(a.receivedAt))
    .find((offer) => offer.sellingAgentRate != null || offer.buyerAgentRate != null);
}

function PaySplit({ file }: { file: TransactionFile }) {
  const source = splitSource(file);
  const price = source?.amount || file.financials.listPrice || file.listPrice || 0;
  const youAreSelling = file.side === "listing";
  const selling = source?.sellingAgentRate ?? (youAreSelling ? file.financials.commissionRate : undefined);
  const buyer = source?.buyerAgentRate ?? (youAreSelling ? undefined : file.financials.commissionRate);
  const sellingPay = selling ? price * selling : 0;
  const buyerPay = buyer ? price * buyer : 0;

  return (
    <section data-focus="pay-split">
      <SectionLabel icon={TrendingUp}>Pay split</SectionLabel>
      <div className="rounded-2xl border border-hairline bg-surface px-5 py-4">
        <p className="max-w-xl text-[14px] leading-relaxed text-ink-600">
          The sale pays two agents. You are the {youAreSelling ? "selling agent" : "buyer agent"} on this folder.
          {source?.status === "accepted"
            ? " These percents come from the accepted offer."
            : source
              ? " These percents come from the latest offer. Accept one to lock the split."
              : " Log an offer to enter both percents."}
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <SplitSide
            label="Selling agent"
            rate={selling}
            dollars={sellingPay}
            yours={youAreSelling}
          />
          <SplitSide
            label="Buyer agent"
            rate={buyer}
            dollars={buyerPay}
            yours={!youAreSelling}
          />
        </div>
        {(sellingPay > 0 || buyerPay > 0) && (
          <p className="mt-3 text-[14px] text-ink-700">
            Together {money(sellingPay + buyerPay)} of the {money(price)} price.
          </p>
        )}
      </div>
    </section>
  );
}

function SplitSide({
  label,
  rate,
  dollars,
  yours,
}: {
  label: string;
  rate?: number;
  dollars: number;
  yours: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3",
        yours ? "border-ink-950 bg-ink-950 text-white" : "border-hairline bg-canvas"
      )}
    >
      <p className={cn("text-[13px] font-semibold", yours ? "text-ink-200" : "text-ink-500")}>
        {label}
        {yours ? " · you" : ""}
      </p>
      {rate != null && rate > 0 ? (
        <>
          <p className={cn("tnum mt-1 text-[22px] font-bold tracking-[-0.02em]", yours ? "text-white" : "text-ink-950")}>
            {money(dollars)}
          </p>
          <p className={cn("tnum text-[13px]", yours ? "text-ink-300" : "text-ink-500")}>
            {+(rate * 100).toFixed(2)}%
          </p>
        </>
      ) : (
        <p className={cn("mt-1 text-[14px]", yours ? "text-ink-300" : "text-ink-500")}>Not entered</p>
      )}
    </div>
  );
}

function OfferCard({
  offer,
  listPrice,
  onAccept,
  onCounter,
  onReject,
}: {
  offer: Offer;
  listPrice: number;
  onAccept: () => void;
  onCounter: () => void;
  onReject: () => void;
}) {
  const delta = listPrice > 0 ? offer.amount - listPrice : 0;
  const canDecide = offer.status === "pending" || offer.status === "countered";

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
          : offer.status === "countered"
          ? "border-ink-200 bg-ink-50/60"
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
            {OFFER_STATUS_LABELS[offer.status]}
          </Badge>
          {canDecide && (
            <>
              <Button size="xs" variant="success" onClick={onAccept}>
                <Check className="h-3 w-3" />
                Accept
              </Button>
              {offer.status === "pending" && (
                <Button size="xs" variant="secondary" onClick={onCounter}>
                  Counter
                </Button>
              )}
              <Button size="xs" variant="secondary" onClick={onReject}>
                <X className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
      </div>

      <OfferPath offer={offer} />

      <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 border-t border-hairline pt-3 text-[13px]">
        <Fact label="Financing" value={FINANCING_LABELS[offer.financing]} />
        {offer.earnestMoney ? (
          <Fact label="Earnest" value={money(offer.earnestMoney)} />
        ) : null}
        {offer.sellingAgentRate ? <Fact label="Selling agent" value={rateLabel(offer.sellingAgentRate, offer.amount)} /> : null}
        {offer.buyerAgentRate ? <Fact label="Buyer agent" value={rateLabel(offer.buyerAgentRate, offer.amount)} /> : null}
        {offer.concession ? <Fact label="Concession" value={money(offer.concession)} /> : null}
        <Fact label="Date of offer" value={formatDate(offer.receivedAt, "MMM d, yyyy")} />
        <Fact label="Date of acceptance" value={offer.acceptedAt ? formatDate(offer.acceptedAt, "MMM d, yyyy") : "Not yet"} />
        <Fact label="Date of closing" value={offer.proposedClosingDate ? formatDate(offer.proposedClosingDate, "MMM d, yyyy") : "Not set"} />
      </dl>

      {offer.contingencies && (
        <p className="mt-2 text-[13px] text-ink-500">
          <span className="font-medium text-ink-700">Contingencies:</span> {offer.contingencies}
        </p>
      )}
      {offer.incentives && (
        <p className="mt-1.5 text-[13px] text-ink-500">
          <span className="font-medium text-ink-700">Incentives:</span> {offer.incentives}
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

function OfferPath({ offer }: { offer: Offer }) {
  const steps = [
    { label: "Offered", date: offer.receivedAt },
    { label: "Countered", date: offer.counteredAt },
    { label: "Accepted", date: offer.status === "accepted" ? offer.acceptedAt : undefined },
  ];

  return (
    <ol className="mt-3 grid grid-cols-3 gap-2">
      {steps.map((step) => (
        <li
          key={step.label}
          className={cn("rounded-xl px-3 py-2", step.date ? "bg-canvas" : "opacity-50")}
        >
          <p className="text-[12px] font-semibold text-ink-800">{step.label}</p>
          <p className="text-[13px] text-ink-600">{step.date ? formatDate(step.date, "MMM d, yyyy") : "Not yet"}</p>
        </li>
      ))}
    </ol>
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
  onSubmit: (offer: Omit<Offer, "id" | "receivedAt"> & { receivedAt?: string }) => void;
}) {
  const [buyerName, setBuyerName] = useState("");
  const [amount, setAmount] = useState("");
  const [earnestMoney, setEarnestMoney] = useState("");
  const [financing, setFinancing] = useState<FinancingType>("conventional");
  const [contingencies, setContingencies] = useState("Inspection, Financing, Appraisal");
  const [concession, setConcession] = useState("");
  const [sellingRate, setSellingRate] = useState("");
  const [buyerRate, setBuyerRate] = useState("");
  const [incentives, setIncentives] = useState("");
  const [offeredOn, setOfferedOn] = useState(todayInput());
  const [counteredOn, setCounteredOn] = useState("");
  const [acceptedOn, setAcceptedOn] = useState("");
  const [closingOn, setClosingOn] = useState("");
  const [offerStatus, setOfferStatus] = useState<"pending" | "countered" | "accepted">("pending");
  const [notes, setNotes] = useState("");

  const reset = () => {
    setBuyerName("");
    setAmount("");
    setEarnestMoney("");
    setFinancing("conventional");
    setContingencies("Inspection, Financing, Appraisal");
    setConcession("");
    setSellingRate("");
    setBuyerRate("");
    setIncentives("");
    setOfferedOn(todayInput());
    setCounteredOn("");
    setAcceptedOn("");
    setClosingOn("");
    setOfferStatus("pending");
    setNotes("");
  };

  const toIso = (day: string) => (day ? new Date(`${day}T12:00:00`).toISOString() : undefined);
  const toRate = (value: string) => (value ? Number(value) / 100 : undefined);

  const submit = () => {
    if (!buyerName.trim() || !amount) return;
    onSubmit({
      buyerName: buyerName.trim(),
      amount: Number(amount),
      earnestMoney: earnestMoney ? Number(earnestMoney) : undefined,
      financing,
      contingencies: contingencies.trim() || undefined,
      concession: concession ? Number(concession) : undefined,
      sellingAgentRate: toRate(sellingRate),
      buyerAgentRate: toRate(buyerRate),
      incentives: incentives.trim() || undefined,
      receivedAt: toIso(offeredOn),
      counteredAt:
        offerStatus === "countered" || (offerStatus === "accepted" && counteredOn)
          ? toIso(counteredOn)
          : undefined,
      acceptedAt: offerStatus === "accepted" ? toIso(acceptedOn) : undefined,
      proposedClosingDate: toIso(closingOn),
      status: offerStatus,
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
          label="Buyer"
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
        <div className="rounded-xl bg-canvas px-4 py-3">
          <p className="text-[14px] font-semibold text-ink-800">Selling agent and buyer agent</p>
          <p className="mt-0.5 text-[13px] text-ink-500">How the pay is split. This is separate from incentives.</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Input
              id="sellingRate"
              label="Selling agent"
              type="number"
              step="0.05"
              trailing="%"
              value={sellingRate}
              onChange={(e) => setSellingRate(e.target.value)}
              placeholder="2.5"
            />
            <Input
              id="buyerRate"
              label="Buyer agent"
              type="number"
              step="0.05"
              trailing="%"
              value={buyerRate}
              onChange={(e) => setBuyerRate(e.target.value)}
              placeholder="2.5"
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="concession"
            label="Seller concession"
            type="number"
            leading="$"
            value={concession}
            onChange={(e) => setConcession(e.target.value)}
            placeholder="10000"
            hint="Cash the seller gives the buyer at closing"
          />
          <Input
            id="incentives"
            label="Incentives"
            value={incentives}
            onChange={(e) => setIncentives(e.target.value)}
            placeholder="One-year home warranty"
            hint="An extra promise. Not agent pay."
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="offeredOn"
            label="Date of offer"
            type="date"
            value={offeredOn}
            onChange={(e) => setOfferedOn(e.target.value)}
            hint="The day this offer arrived"
          />
          <Input
            id="closingOn"
            label="Date of closing"
            type="date"
            value={closingOn}
            onChange={(e) => setClosingOn(e.target.value)}
            hint="The closing day named on this offer"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="counteredOn"
            label="Date of counter"
            type="date"
            value={counteredOn}
            onChange={(e) => setCounteredOn(e.target.value)}
            hint="The day the seller sent back different terms"
          />
          <Input
            id="acceptedOn"
            label="Date of acceptance"
            type="date"
            value={acceptedOn}
            onChange={(e) => setAcceptedOn(e.target.value)}
            hint="The day the seller said yes"
          />
        </div>
        <div>
          <p className="mb-2 text-[14px] font-medium text-ink-700">How should this offer be filed?</p>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ["pending", "Offered"],
                ["countered", "Countered"],
                ["accepted", "Accepted"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setOfferStatus(value)}
                className={cn(
                  "rounded-xl border px-3 py-2 text-[14px] font-semibold",
                  offerStatus === value
                    ? "border-ink-950 bg-ink-950 text-white"
                    : "border-hairline bg-surface text-ink-700 hover:border-hairline-strong"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
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

function todayInput() {
  const day = new Date();
  const month = String(day.getMonth() + 1).padStart(2, "0");
  const date = String(day.getDate()).padStart(2, "0");
  return `${day.getFullYear()}-${month}-${date}`;
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
