"use client";

import { useState } from "react";
import { differenceInCalendarDays, format, parseISO, subDays } from "date-fns";
import { CalendarDays, Eye, Home, Images, MessageSquareQuote, Search, Star, X } from "lucide-react";
import { BlobImage } from "@/components/ui/blob-image";
import { buyerCashToClose, sellerNet } from "@/lib/client/portal";
import { money } from "@/lib/work/payout";
import { cn } from "@/lib/utils/cn";
import { PageTitle, PCard } from "./client-shell";
import type { Photo, ShowingFeedbackSentiment, TransactionFile } from "@/types";

const SENTIMENT: Record<ShowingFeedbackSentiment, { label: string; bar: string }> = {
  hot: { label: "Loved it", bar: "bg-emerald-500" },
  warm: { label: "Interested", bar: "bg-itera-500" },
  cool: { label: "Lukewarm", bar: "bg-amber-400" },
  pass: { label: "Not for them", bar: "bg-ink-300" },
};

/* ═══ Your Home (sellers) / Your Search (buyers) ═════════════════════ */

export function ClientProperty({ file }: { file: TransactionFile }) {
  return file.side === "listing" ? <SellerHome file={file} /> : <BuyerSearch file={file} />;
}

function SellerHome({ file }: { file: TransactionFile }) {
  const [viewing, setViewing] = useState<Photo | null>(null);
  const photos = file.photos ?? [];
  const ld = file.listingDetails;
  const appts = [...(file.showings?.appointments ?? [])].sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt));
  const liveTask = file.checklist.find((t) => t.id === "mls_entry");
  const daysOnMarket = liveTask?.completedAt ? differenceInCalendarDays(new Date(), parseISO(liveTask.completedAt)) : null;
  const lastWeek = appts.filter((a) => parseISO(a.scheduledAt) >= subDays(new Date(), 7)).length;
  const counts = (["hot", "warm", "cool", "pass"] as ShowingFeedbackSentiment[]).map((s) => ({
    s,
    n: appts.filter((a) => a.sentiment === s).length,
  }));
  const openHouses = file.marketing?.openHouses ?? [];

  const facts = [
    ld?.beds ? { label: "Bedrooms", value: String(ld.beds) } : null,
    ld?.baths ? { label: "Bathrooms", value: String(ld.baths) } : null,
    ld?.sqft ? { label: "Square feet", value: ld.sqft.toLocaleString() } : null,
    ld?.yearBuilt ? { label: "Built", value: String(ld.yearBuilt) } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div>
      <PageTitle title="Your home" sub="How your home is being presented, and how buyers are responding." />
      <div className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-4">
          <Stat label="Asking price" value={file.listPrice ? money(file.listPrice) : "—"} />
          <Stat label="Days on market" value={daysOnMarket !== null ? String(daysOnMarket) : "Not live yet"} />
          <Stat label="Showings" value={String(appts.length)} sub={lastWeek ? `${lastWeek} this week` : undefined} />
          <Stat label="Open house visitors" value={String(openHouses.reduce((n, o) => n + (o.visitors || 0), 0))} />
        </div>

        <PCard title={`Photos (${photos.length})`} icon={Images}>
          {photos.length === 0 ? (
            <p className="text-[16px] text-ink-600">Your agent will add listing photos here once they&apos;re taken.</p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {photos.map((p) => (
                <li key={p.id}>
                  <button onClick={() => setViewing(p)} className="group block w-full overflow-hidden rounded-xl text-left" aria-label={`View ${p.caption || p.name}`}>
                    <BlobImage blobKey={p.thumbBlobId} alt={p.caption || p.name} className="aspect-[4/3] w-full" imgClassName="transition-transform group-hover:scale-[1.03]" />
                  </button>
                  {p.caption && <p className="mt-1.5 text-[14px] text-ink-600">{p.caption}</p>}
                </li>
              ))}
            </ul>
          )}
        </PCard>

        {facts.length > 0 && (
          <PCard title="The listing" icon={Home}>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {facts.map((f) => (
                <div key={f.label} className="rounded-xl bg-canvas px-4 py-3">
                  <dt className="text-[14px] text-ink-500">{f.label}</dt>
                  <dd className="tnum text-[20px] font-bold text-ink-950">{f.value}</dd>
                </div>
              ))}
            </dl>
            {ld?.publicRemarks && <p className="mt-4 text-[16px] leading-relaxed text-ink-700">{ld.publicRemarks}</p>}
          </PCard>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {file.portalAccess?.visibility.showingFeedback !== false && (
          <PCard title="What buyers are saying" icon={MessageSquareQuote}>
            {appts.length === 0 ? (
              <p className="text-[16px] text-ink-600">Feedback from showings will appear here.</p>
            ) : (
              <>
                <ul className="space-y-2.5">
                  {counts.map(({ s, n }) => (
                    <li key={s} className="flex items-center gap-3">
                      <span className="w-28 shrink-0 text-[15px] text-ink-700">{SENTIMENT[s].label}</span>
                      <span className="h-3 flex-1 overflow-hidden rounded-full bg-ink-100">
                        <span className={cn("block h-full rounded-full", SENTIMENT[s].bar)} style={{ width: `${(n / appts.length) * 100}%` }} />
                      </span>
                      <span className="tnum w-6 text-right text-[15px] font-semibold text-ink-900">{n}</span>
                    </li>
                  ))}
                </ul>
                <ul className="mt-5 space-y-3 border-t border-hairline pt-4">
                  {appts.filter((a) => a.feedback).slice(0, 4).map((a) => (
                    <li key={a.id}>
                      {/* Names stay private; the feedback itself is what matters to the seller. */}
                      <p className="text-[16px] italic text-ink-800">&ldquo;{a.feedback}&rdquo;</p>
                      <p className="mt-0.5 text-[14px] text-ink-500">A buyer&apos;s agent · {format(parseISO(a.scheduledAt), "MMM d")}</p>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </PCard>
          )}

          <PCard title="Open houses" icon={CalendarDays}>
            {openHouses.length === 0 ? (
              <p className="text-[16px] text-ink-600">None scheduled yet.</p>
            ) : (
              <ul className="divide-y divide-hairline">
                {openHouses.map((o) => {
                  const past = parseISO(o.date) < new Date();
                  return (
                    <li key={o.id} className="flex items-center justify-between gap-3 py-3">
                      <div>
                        <p className="text-[16px] font-semibold text-ink-900">{format(parseISO(o.date), "EEEE, MMMM d")}</p>
                        <p className="text-[14px] text-ink-500">
                          {o.startTime}–{o.endTime}
                        </p>
                      </div>
                      <span className={cn("rounded-full px-3 py-1 text-[14px] font-semibold", past ? "bg-ink-100 text-ink-700" : "bg-itera-100 text-itera-800")}>
                        {past ? `${o.visitors} visitors` : "Coming up"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </PCard>
        </div>
      </div>

      {viewing && (
        <div className="fixed inset-0 z-[95] flex flex-col bg-ink-950/95 p-4" onClick={() => setViewing(null)}>
          <button className="ml-auto flex items-center gap-2 rounded-lg px-3 py-2 text-[15px] font-semibold text-white hover:bg-white/10">
            <X className="h-5 w-5" />
            Close
          </button>
          <BlobImage blobKey={viewing.blobId} alt={viewing.caption || viewing.name} className="min-h-0 flex-1 bg-transparent" imgClassName="object-contain" />
        </div>
      )}
    </div>
  );
}

function BuyerSearch({ file }: { file: TransactionFile }) {
  const bs = file.buyerSearch;
  const toured = (file.showings?.appointments ?? []).filter((a) => a.propertyAddress);
  const criteria = [
    bs?.minPrice || bs?.maxPrice ? { label: "Budget", value: `${money(bs.minPrice)} – ${money(bs.maxPrice)}` } : null,
    bs?.bedsMin ? { label: "Bedrooms", value: `${bs.bedsMin}+` } : null,
    bs?.bathsMin ? { label: "Bathrooms", value: `${bs.bathsMin}+` } : null,
    bs?.areas ? { label: "Areas", value: bs.areas } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div>
      <PageTitle title="Your search" sub="What you're looking for, and the homes you've seen." />
      <div className="space-y-6">
        <PCard title="What you're looking for" icon={Search}>
          {criteria.length === 0 ? (
            <p className="text-[16px] text-ink-600">Your agent is setting up your search criteria.</p>
          ) : (
            <dl className="grid gap-3 sm:grid-cols-2">
              {criteria.map((c) => (
                <div key={c.label} className="rounded-xl bg-canvas px-4 py-3">
                  <dt className="text-[14px] text-ink-500">{c.label}</dt>
                  <dd className="text-[17px] font-semibold text-ink-950">{c.value}</dd>
                </div>
              ))}
            </dl>
          )}
          {bs?.mustHaves && (
            <p className="mt-4 text-[16px] text-ink-700">
              <strong className="font-semibold">Must have:</strong> {bs.mustHaves}
            </p>
          )}
          {bs?.dealBreakers && (
            <p className="mt-1.5 text-[16px] text-ink-700">
              <strong className="font-semibold">Deal breakers:</strong> {bs.dealBreakers}
            </p>
          )}
          <p className="mt-4 rounded-xl bg-itera-50 px-4 py-3 text-[15px] text-itera-900">
            {bs?.alertsEnabled ? "New listings that match are sent to you as soon as they appear." : "New-listing alerts are being set up."}
          </p>
        </PCard>

        <PCard title={`Your shortlist (${bs?.shortlist?.length ?? 0})`} icon={Star}>
          {!bs?.shortlist?.length ? (
            <p className="text-[16px] text-ink-600">Homes you and your agent shortlist will appear here.</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {bs.shortlist.map((h) => (
                <li key={h.id} className="rounded-xl border border-hairline p-4">
                  <p className="text-[16px] font-semibold text-ink-950">{h.address}</p>
                  <span className={cn("mt-2 inline-block rounded-full px-2.5 py-0.5 text-[13px] font-semibold text-white", SENTIMENT[h.interest].bar)}>
                    {SENTIMENT[h.interest].label}
                  </span>
                  {h.notes && <p className="mt-2 text-[15px] text-ink-600">{h.notes}</p>}
                </li>
              ))}
            </ul>
          )}
        </PCard>

        <PCard title={`Homes you've toured (${toured.length})`} icon={Eye}>
          {toured.length === 0 ? (
            <p className="text-[16px] text-ink-600">Tours will be listed here with your notes.</p>
          ) : (
            <ul className="divide-y divide-hairline">
              {toured.map((a) => (
                <li key={a.id} className="py-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-[16px] font-semibold text-ink-900">{a.propertyAddress}</p>
                    <p className="text-[14px] text-ink-500">{format(parseISO(a.scheduledAt), "MMM d")}</p>
                  </div>
                  {a.feedback && <p className="mt-0.5 text-[15px] text-ink-600">{a.feedback}</p>}
                </li>
              ))}
            </ul>
          )}
        </PCard>
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-hairline bg-surface px-4 py-4 shadow-sm">
      <p className="text-[14px] text-ink-500">{label}</p>
      <p className="tnum mt-1 text-[24px] font-bold leading-tight text-ink-950">{value}</p>
      {sub && <p className="text-[14px] text-ink-500">{sub}</p>}
    </div>
  );
}

/* ═══ Money ══════════════════════════════════════════════════════════ */

export function ClientMoney({ file }: { file: TransactionFile }) {
  return file.side === "listing" ? <SellerMoney file={file} /> : <BuyerMoney file={file} />;
}

function NumberField({
  label,
  value,
  onChange,
  prefix,
  suffix,
  hint,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  prefix?: string;
  suffix?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-[15px] font-medium text-ink-700">{label}</span>
      <span className="relative mt-1.5 block">
        {prefix && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[16px] text-ink-500">{prefix}</span>}
        <input
          type="number"
          inputMode="decimal"
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className={cn(
            "tnum block h-12 w-full rounded-xl border-0 bg-surface text-[17px] text-ink-950 ring-1 ring-inset ring-hairline-strong focus:outline-none focus:ring-2 focus:ring-itera-500",
            prefix ? "pl-8" : "pl-4",
            suffix ? "pr-10" : "pr-4"
          )}
        />
        {suffix && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[16px] text-ink-500">{suffix}</span>}
      </span>
      {hint && <span className="mt-1 block text-[14px] text-ink-500">{hint}</span>}
    </label>
  );
}

function Line({ label, value, strong, minus }: { label: string; value: number; strong?: boolean; minus?: boolean }) {
  return (
    <div className={cn("flex items-baseline justify-between gap-4 py-3", strong && "border-t-2 border-ink-950")}>
      <span className={cn("text-[16px]", strong ? "font-bold text-ink-950" : "text-ink-600")}>{label}</span>
      <span className={cn("tnum", strong ? "text-[26px] font-bold text-ink-950" : "text-[17px] font-semibold text-ink-800")}>
        {minus ? "−" : ""}
        {money(Math.abs(value))}
      </span>
    </div>
  );
}

function SellerMoney({ file }: { file: TransactionFile }) {
  const accepted = file.offers.find((o) => o.status === "accepted");
  const [price, setPrice] = useState(accepted?.amount ?? file.listPrice ?? 0);
  const [listingPct, setListingPct] = useState(+(file.financials.commissionRate * 100).toFixed(2));
  const [buyerPct, setBuyerPct] = useState(2.5);
  const [closingPct, setClosingPct] = useState(1);
  const [payoff, setPayoff] = useState(0);
  const r = sellerNet({ price, listingCommissionPct: listingPct, buyerAgentPct: buyerPct, closingCostsPct: closingPct, payoff });

  return (
    <div>
      <PageTitle title="Money" sub="An estimate of what you'll walk away with. Change any number to see how it moves." />
      <div className="space-y-6">
        {file.offers.length > 0 && (
          <PCard title="Offers">
            <p className="text-[16px] text-ink-700">
              {file.offers.length} offer{file.offers.length === 1 ? "" : "s"} received
              {accepted ? (
                <>
                  . Accepted at <strong className="text-ink-950">{money(accepted.amount)}</strong>
                  {file.listPrice && accepted.amount !== file.listPrice ? "" : ""}.
                </>
              ) : (
                ". Your agent will walk you through them."
              )}
            </p>
            {file.financials.earnestMoney > 0 && (
              <p className="mt-2 text-[16px] text-ink-700">
                Buyer&apos;s deposit: <strong className="text-ink-950">{money(file.financials.earnestMoney)}</strong> —{" "}
                {file.financials.earnestMoneyStatus === "received" ? "received and held by the title company" : "not yet received"}
              </p>
            )}
          </PCard>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <PCard title="Your numbers">
            <div className="space-y-4">
              <NumberField label={accepted ? "Sale price" : "Expected sale price"} value={price} onChange={setPrice} prefix="$" />
              <NumberField label="Your agent's commission" value={listingPct} onChange={setListingPct} suffix="%" hint="From your listing agreement" />
              <NumberField label="Buyer's agent compensation" value={buyerPct} onChange={setBuyerPct} suffix="%" hint="If you've agreed to contribute — set to 0 if not" />
              <NumberField label="Closing costs" value={closingPct} onChange={setClosingPct} suffix="%" hint="Title, escrow, and fees — about 1% is typical" />
              <NumberField label="Mortgage still owed" value={payoff} onChange={setPayoff} prefix="$" hint="Your lender can give you the exact payoff" />
            </div>
          </PCard>

          <PCard title="Estimated take-home">
            <Line label="Sale price" value={price} />
            <Line label="Your agent's commission" value={r.listingCommission} minus />
            {r.buyerAgent > 0 && <Line label="Buyer's agent compensation" value={r.buyerAgent} minus />}
            <Line label="Closing costs" value={r.closingCosts} minus />
            {payoff > 0 && <Line label="Mortgage payoff" value={payoff} minus />}
            <Line label="You walk away with" value={r.net} strong />
            <p className="mt-3 text-[14px] leading-relaxed text-ink-500">
              An estimate, not a final figure. The title company sends the exact numbers on your settlement statement before closing.
            </p>
          </PCard>
        </div>
      </div>
    </div>
  );
}

function BuyerMoney({ file }: { file: TransactionFile }) {
  const accepted = file.offers.find((o) => o.status === "accepted");
  const [price, setPrice] = useState(accepted?.amount ?? file.listPrice ?? 0);
  const [downPct, setDownPct] = useState(20);
  const [closingPct, setClosingPct] = useState(2.5);
  const [rate, setRate] = useState(6.5);
  const [taxIns, setTaxIns] = useState(Math.round(((file.listPrice || 0) * 0.022) / 12 + 150));
  const earnest = file.financials.earnestMoney || 0;
  const r = buyerCashToClose({ price, downPct, closingCostsPct: closingPct, earnestMoney: earnest, ratePct: rate, taxInsuranceMonthly: taxIns });

  return (
    <div>
      <PageTitle title="Money" sub="What you'll need at closing and what your monthly payment might be. Change any number." />
      <div className="grid gap-6 lg:grid-cols-2">
        <PCard title="Your numbers">
          <div className="space-y-4">
            <NumberField label={accepted ? "Purchase price" : "Target price"} value={price} onChange={setPrice} prefix="$" />
            <NumberField label="Down payment" value={downPct} onChange={setDownPct} suffix="%" hint={`${money((price * downPct) / 100)}`} />
            <NumberField label="Interest rate" value={rate} onChange={setRate} suffix="%" hint="30-year fixed. Your lender confirms your actual rate." />
            <NumberField label="Closing costs" value={closingPct} onChange={setClosingPct} suffix="%" hint="Lender, title, and prepaid items — 2–3% is typical" />
            <NumberField label="Property tax and insurance, per month" value={taxIns} onChange={setTaxIns} prefix="$" />
          </div>
        </PCard>

        <div className="space-y-6">
          <PCard title="Cash needed at closing">
            <Line label="Down payment" value={r.down} />
            <Line label="Closing costs" value={r.closingCosts} />
            {earnest > 0 && <Line label="Deposit already paid" value={earnest} minus />}
            <Line label="Bring to closing" value={r.cashToClose} strong />
          </PCard>
          <PCard title="Estimated monthly payment">
            <Line label={`Loan of ${money(r.loan)} — principal and interest`} value={r.principalInterest} />
            <Line label="Tax and insurance" value={taxIns} />
            <Line label="About per month" value={r.monthlyTotal} strong />
            <p className="mt-3 text-[14px] leading-relaxed text-ink-500">
              Estimates only. Your lender&apos;s Closing Disclosure, sent at least three days before closing, has the exact amounts.
            </p>
          </PCard>
        </div>
      </div>
    </div>
  );
}
