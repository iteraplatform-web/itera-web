"use client";

import { useState } from "react";
import { Megaphone, Plus, Search } from "lucide-react";
import { v4 as uuid } from "uuid";
import { useTransactionsStore } from "@/stores";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { SectionLabel } from "@/components/ui/card";
import { SoftCompleteNudge, WorkInstructions, WorkStatusChip } from "@/components/workspace/work-ui";
import { buyerSearchReadiness, marketingReadiness } from "@/lib/work/readiness";
import type { ShowingFeedbackSentiment, TransactionFile } from "@/types";

const PORTALS = ["Zillow", "Realtor.com", "Redfin", "Brokerage site", "Facebook Marketplace"];

export function MarketingSection({ file }: { file: TransactionFile }) {
  if (file.side === "buying") return <BuyerSearchPanel file={file} />;
  return <ListingMarketingPanel file={file} />;
}

function ListingMarketingPanel({ file }: { file: TransactionFile }) {
  const updateMarketing = useTransactionsStore((s) => s.updateMarketing);
  const toggleTask = useTransactionsStore((s) => s.toggleTask);
  const [draft, setDraft] = useState(file.marketing);
  const [oh, setOh] = useState({ date: "", startTime: "1:00 PM", endTime: "3:00 PM", visitors: 0, notes: "" });
  const readiness = marketingReadiness(draft);
  const task = file.checklist.find((t) => t.id === "marketing_launch");

  const togglePortal = (portal: string) => {
    const has = draft.syndicatedPortals.includes(portal);
    setDraft({
      ...draft,
      syndicatedPortals: has
        ? draft.syndicatedPortals.filter((p) => p !== portal)
        : [...draft.syndicatedPortals, portal],
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <SectionLabel icon={Megaphone}>Campaign</SectionLabel>
        <WorkStatusChip status={readiness} />
      </div>
      <WorkInstructions
        title="Launch marketing from the file"
        steps={[
          "Confirm syndication to the major portals",
          "Publish the social and email announcement",
          "Schedule the first open house",
        ]}
        externalNote="Live portal posting stays with your syndication tools — record what launched here."
      />

      <div className="flex flex-wrap gap-2">
        {PORTALS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => togglePortal(p)}
            className={`rounded-full px-3 py-1.5 text-[13px] font-semibold ring-1 ring-inset ${
              draft.syndicatedPortals.includes(p)
                ? "bg-itera-50 text-itera-700 ring-itera-200"
                : "bg-canvas text-ink-500 ring-hairline"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-[14px]">
          <input
            type="checkbox"
            checked={draft.socialPosted}
            onChange={(e) => setDraft({ ...draft, socialPosted: e.target.checked })}
          />
          Social announcement posted
        </label>
        <label className="flex items-center gap-2 text-[14px]">
          <input
            type="checkbox"
            checked={draft.emailAnnouncementSent}
            onChange={(e) => setDraft({ ...draft, emailAnnouncementSent: e.target.checked })}
          />
          Email announcement sent
        </label>
      </div>

      <Textarea
        id="campaign-notes"
        label="Campaign notes"
        rows={2}
        value={draft.campaignNotes}
        onChange={(e) => setDraft({ ...draft, campaignNotes: e.target.value })}
      />

      <div className="rounded-2xl border border-hairline p-4">
        <p className="mb-3 text-[14px] font-semibold text-ink-900">Add open house</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            id="oh-date"
            label="Date"
            type="date"
            value={oh.date}
            onChange={(e) => setOh({ ...oh, date: e.target.value })}
          />
          <Input
            id="oh-visitors"
            label="Visitors"
            type="number"
            value={oh.visitors || ""}
            onChange={(e) => setOh({ ...oh, visitors: Number(e.target.value) })}
          />
          <Input
            id="oh-start"
            label="Start"
            value={oh.startTime}
            onChange={(e) => setOh({ ...oh, startTime: e.target.value })}
          />
          <Input
            id="oh-end"
            label="End"
            value={oh.endTime}
            onChange={(e) => setOh({ ...oh, endTime: e.target.value })}
          />
        </div>
        <div className="mt-3 flex justify-end">
          <Button
            variant="secondary"
            onClick={() => {
              if (!oh.date) return;
              setDraft({
                ...draft,
                openHouses: [
                  {
                    id: uuid(),
                    date: new Date(oh.date).toISOString(),
                    startTime: oh.startTime,
                    endTime: oh.endTime,
                    visitors: oh.visitors,
                    notes: oh.notes,
                  },
                  ...draft.openHouses,
                ],
              });
              setOh({ date: "", startTime: "1:00 PM", endTime: "3:00 PM", visitors: 0, notes: "" });
            }}
          >
            <Plus className="h-4 w-4" />
            Log open house
          </Button>
        </div>
      </div>

      {draft.openHouses.length > 0 && (
        <div className="space-y-2">
          {draft.openHouses.map((h) => (
            <div key={h.id} className="rounded-xl border border-hairline px-4 py-3 text-[14px]">
              <p className="font-semibold text-ink-900">
                {new Date(h.date).toLocaleDateString()} · {h.startTime}–{h.endTime}
              </p>
              <p className="text-ink-500">{h.visitors} visitors{h.notes ? ` — ${h.notes}` : ""}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={() => updateMarketing(file.id, draft)}>Save marketing</Button>
      </div>
      {task && (
        <SoftCompleteNudge
          ready={readiness === "ready"}
          taskTitle={task.title}
          taskCompleted={task.status === "completed"}
          onComplete={() => toggleTask(file.id, task.id)}
        />
      )}
    </div>
  );
}

function BuyerSearchPanel({ file }: { file: TransactionFile }) {
  const updateBuyerSearch = useTransactionsStore((s) => s.updateBuyerSearch);
  const toggleTask = useTransactionsStore((s) => s.toggleTask);
  const [draft, setDraft] = useState(file.buyerSearch);
  const [item, setItem] = useState({ address: "", notes: "", interest: "warm" as ShowingFeedbackSentiment });
  const readiness = buyerSearchReadiness(draft);
  const task = file.checklist.find((t) => t.id === "property_search");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <SectionLabel icon={Search}>Buyer search</SectionLabel>
        <WorkStatusChip status={readiness} />
      </div>
      <WorkInstructions
        title="Configure search criteria on the file"
        steps={[
          "Set price range, beds/baths, and target areas",
          "Turn on alerts for the client",
          "Keep a shortlist of properties under review",
        ]}
        externalNote="Live MLS alerts run in your board tools — keep the criteria and shortlist here."
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          id="min"
          label="Min price"
          type="number"
          leading="$"
          value={draft.minPrice || ""}
          onChange={(e) => setDraft({ ...draft, minPrice: Number(e.target.value) })}
        />
        <Input
          id="max"
          label="Max price"
          type="number"
          leading="$"
          value={draft.maxPrice || ""}
          onChange={(e) => setDraft({ ...draft, maxPrice: Number(e.target.value) })}
        />
        <Input
          id="beds"
          label="Beds min"
          type="number"
          value={draft.bedsMin || ""}
          onChange={(e) => setDraft({ ...draft, bedsMin: Number(e.target.value) })}
        />
        <Input
          id="baths"
          label="Baths min"
          type="number"
          value={draft.bathsMin || ""}
          onChange={(e) => setDraft({ ...draft, bathsMin: Number(e.target.value) })}
        />
      </div>
      <Input
        id="areas"
        label="Areas"
        value={draft.areas}
        onChange={(e) => setDraft({ ...draft, areas: e.target.value })}
      />
      <Textarea
        id="must"
        label="Must-haves"
        rows={2}
        value={draft.mustHaves}
        onChange={(e) => setDraft({ ...draft, mustHaves: e.target.value })}
      />
      <Textarea
        id="deal"
        label="Deal-breakers"
        rows={2}
        value={draft.dealBreakers}
        onChange={(e) => setDraft({ ...draft, dealBreakers: e.target.value })}
      />
      <label className="flex items-center gap-2 text-[14px]">
        <input
          type="checkbox"
          checked={draft.alertsEnabled}
          onChange={(e) => setDraft({ ...draft, alertsEnabled: e.target.checked })}
        />
        Instant alerts enabled for the client
      </label>

      <div className="rounded-2xl border border-hairline p-4">
        <p className="mb-3 text-[14px] font-semibold">Add to shortlist</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            id="sl-addr"
            label="Address"
            value={item.address}
            onChange={(e) => setItem({ ...item, address: e.target.value })}
          />
          <Select
            id="sl-int"
            label="Interest"
            value={item.interest}
            onChange={(e) =>
              setItem({ ...item, interest: e.target.value as ShowingFeedbackSentiment })
            }
          >
            <option value="hot">Hot</option>
            <option value="warm">Warm</option>
            <option value="cool">Cool</option>
            <option value="pass">Pass</option>
          </Select>
          <Input
            id="sl-notes"
            label="Notes"
            className="sm:col-span-2"
            value={item.notes}
            onChange={(e) => setItem({ ...item, notes: e.target.value })}
          />
        </div>
        <div className="mt-3 flex justify-end">
          <Button
            variant="secondary"
            onClick={() => {
              if (!item.address.trim()) return;
              setDraft({
                ...draft,
                shortlist: [
                  { id: uuid(), address: item.address, notes: item.notes, interest: item.interest },
                  ...draft.shortlist,
                ],
              });
              setItem({ address: "", notes: "", interest: "warm" });
            }}
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>
      </div>

      {draft.shortlist.length > 0 && (
        <div className="space-y-2">
          {draft.shortlist.map((s) => (
            <div key={s.id} className="rounded-xl border border-hairline px-4 py-3 text-[14px]">
              <div className="flex justify-between gap-2">
                <p className="font-semibold text-ink-900">{s.address}</p>
                <span className="text-[13px] uppercase text-ink-500">{s.interest}</span>
              </div>
              {s.notes && <p className="mt-1 text-ink-600">{s.notes}</p>}
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={() => updateBuyerSearch(file.id, draft)}>Save search</Button>
      </div>
      {task && (
        <SoftCompleteNudge
          ready={readiness === "ready"}
          taskTitle={task.title}
          taskCompleted={task.status === "completed"}
          onComplete={() => toggleTask(file.id, task.id)}
        />
      )}
    </div>
  );
}
