"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  Home,
  Images,
  LayoutGrid,
  List,
  Megaphone,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { v4 as uuid } from "uuid";
import { useTransactionsStore } from "@/stores";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { SectionLabel } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Progress } from "@/components/ui/progress";
import { Segmented } from "@/components/ui/misc";
import { SoftCompleteNudge, WorkInstructions, WorkStatusChip } from "@/components/workspace/work-ui";
import { sectionHref } from "@/components/workspace/workspace-sidebar";
import {
  campaignDatePhrase,
  isPortalPoint,
  keepGoingPoints,
  launchGroups,
  launchPoints,
  MAIN_MARKETING_DATE_KEYS,
  MARKETING_DATE_FIELDS,
  nextOpenHouse,
  openHouseSteps,
  type MarketingDateKey,
  type MarketingFlag,
  type MarketingPoint,
  type OpenHouseStepKey,
} from "@/lib/work/marketing-plan";
import {
  buyerSearchReadiness,
  marketingReadiness,
  photoLaunchPrep,
  visitLaunchPrep,
  wordsLaunchPrep,
  type LaunchPrepTone,
} from "@/lib/work/readiness";
import { cn } from "@/lib/utils/cn";
import type {
  CustomMarketingDate,
  MarketingDates,
  OpenHouse,
  ShowingFeedbackSentiment,
  TransactionFile,
} from "@/types";

type LayoutMode = "cards" | "list";

function prepToneClass(tone: LaunchPrepTone) {
  if (tone === "ready") return "border-emerald-200 bg-emerald-50/50";
  if (tone === "started") return "border-amber-200 bg-amber-50/60 hover:border-amber-300";
  return "border-hairline bg-surface hover:border-hairline-strong";
}

function prepIconClass(tone: LaunchPrepTone) {
  if (tone === "ready") return "bg-emerald-100 text-emerald-700";
  if (tone === "started") return "bg-amber-100 text-amber-700";
  return "bg-canvas text-ink-500";
}

const LAYOUT_KEY = "itera-marketing-layout";

export function MarketingSection({ file }: { file: TransactionFile }) {
  if (file.side === "buying") return <BuyerSearchPanel file={file} />;
  return <ListingMarketingPanel file={file} />;
}

function ListingMarketingPanel({ file }: { file: TransactionFile }) {
  const updateMarketing = useTransactionsStore((s) => s.updateMarketing);
  const toggleTask = useTransactionsStore((s) => s.toggleTask);
  const [draft, setDraft] = useState(file.marketing);
  const [layout, setLayout] = useState<LayoutMode>("cards");
  const [oh, setOh] = useState({ date: "", startTime: "1:00 PM", endTime: "3:00 PM", visitors: 0, notes: "" });
  const sheetLive = file.listingDetails.publishStatus === "published_external";
  const points = launchPoints(draft, sheetLive);
  const groups = launchGroups(draft, sheetLive);
  const done = points.filter((p) => p.done).length;
  const requiredDone = points.filter((p) => !p.optional && p.done).length;
  const requiredTotal = points.filter((p) => !p.optional).length;
  const optionalTotal = points.length - requiredTotal;
  const optionalDone = done - requiredDone;
  const requiredLeft = requiredTotal - requiredDone;
  const requiredPct = requiredTotal ? (requiredDone / requiredTotal) * 100 : 0;
  const optionalPct = optionalTotal ? (optionalDone / optionalTotal) * 100 : 0;
  const keep = keepGoingPoints(draft);
  const keepDone = keep.filter((p) => p.done).length;
  const live = sheetLive || draft.mlsLive;
  const readiness = marketingReadiness(draft, sheetLive);
  const task = file.checklist.find((t) => t.id === "marketing_launch");
  const photoPrep = photoLaunchPrep(file);
  const wordsPrep = wordsLaunchPrep(file.listingDetails);
  const visitPrep = visitLaunchPrep(file.showings);
  const upcomingHouse = nextOpenHouse(draft.openHouses);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LAYOUT_KEY);
      if (saved === "cards" || saved === "list") setLayout(saved);
    } catch {
      /* ignore */
    }
  }, []);

  const changeLayout = (next: LayoutMode) => {
    setLayout(next);
    try {
      localStorage.setItem(LAYOUT_KEY, next);
    } catch {
      /* ignore */
    }
  };

  const setDate = (key: MarketingDateKey, value: string) => {
    setDraft({
      ...draft,
      dates: {
        ...draft.dates,
        [key]: value ? new Date(`${value}T12:00:00`).toISOString() : undefined,
      },
    });
  };

  const setDateNote = (key: MarketingDateKey, note: string) => {
    setDraft({ ...draft, dateNotes: { ...draft.dateNotes, [key]: note } });
  };

  const toggleOverviewDate = (key: MarketingDateKey) => {
    const hidden = draft.hiddenOverviewDates ?? [];
    setDraft({
      ...draft,
      hiddenOverviewDates: hidden.includes(key) ? hidden.filter((k) => k !== key) : [...hidden, key],
    });
  };

  const addCustomDate = (input: { label: string; date: string; note: string; showOnOverview: boolean }) => {
    const item: CustomMarketingDate = {
      id: uuid(),
      label: input.label.trim(),
      note: input.note.trim(),
      date: input.date ? new Date(`${input.date}T12:00:00`).toISOString() : undefined,
      showOnOverview: input.showOnOverview,
    };
    setDraft({ ...draft, customDates: [item, ...(draft.customDates ?? [])] });
  };

  const updateCustomDate = (id: string, patch: Partial<CustomMarketingDate>) => {
    setDraft({
      ...draft,
      customDates: (draft.customDates ?? []).map((d) => (d.id === id ? { ...d, ...patch } : d)),
    });
  };

  const removeCustomDate = (id: string) => {
    setDraft({ ...draft, customDates: (draft.customDates ?? []).filter((d) => d.id !== id) });
  };

  const clearPresetDate = (key: MarketingDateKey) => {
    const notes = { ...(draft.dateNotes ?? {}) };
    delete notes[key];
    setDraft({
      ...draft,
      dates: { ...draft.dates, [key]: undefined },
      dateNotes: notes,
      hiddenOverviewDates: (draft.hiddenOverviewDates ?? []).filter((k) => k !== key),
    });
  };

  const stampDate = (key: MarketingDateKey, dates: MarketingDates): MarketingDates => {
    if (dates[key]) return dates;
    return { ...dates, [key]: new Date().toISOString() };
  };

  const togglePoint = (point: MarketingPoint) => {
    if (point.id === "mlsLive") {
      if (sheetLive) return;
      const next = !draft.mlsLive;
      setDraft({
        ...draft,
        mlsLive: next,
        dates: next ? stampDate("goLiveAt", draft.dates) : draft.dates,
      });
      return;
    }
    if (isPortalPoint(point.id)) {
      const has = draft.syndicatedPortals.includes(point.id);
      setDraft({
        ...draft,
        syndicatedPortals: has
          ? draft.syndicatedPortals.filter((p) => p !== point.id)
          : [...draft.syndicatedPortals, point.id],
      });
      return;
    }
    const key = point.id as MarketingFlag;
    const next = !draft[key];
    let dates = draft.dates;
    if (next) {
      if (key === "comingSoon") dates = stampDate("comingSoonAt", dates);
      if (key === "sellerUpdate") dates = stampDate("sellerUpdateAt", dates);
      if (key === "refreshPost") dates = stampDate("refreshPostAt", dates);
      if (key === "priceTalk") dates = stampDate("priceTalkAt", dates);
    }
    setDraft({ ...draft, [key]: next, dates });
  };

  const patchHouse = (id: string, key: OpenHouseStepKey) => {
    setDraft({
      ...draft,
      openHouses: draft.openHouses.map((h) => (h.id === id ? { ...h, [key]: !h[key] } : h)),
    });
  };

  const prep = [
    {
      ...photoPrep,
      label: "Photos",
      href: sectionHref(file.id, "photos"),
      icon: Images,
    },
    {
      ...wordsPrep,
      label: "Listing words",
      href: sectionHref(file.id, "listing_details"),
      icon: Megaphone,
    },
    {
      ...visitPrep,
      label: "Visit rules",
      href: sectionHref(file.id, "showings"),
      icon: Home,
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionLabel icon={Megaphone} className="mb-0">
          Campaign
        </SectionLabel>
        <WorkStatusChip status={readiness} />
      </div>

      <div>
        <p className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-ink-500">Before you launch</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {prep.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "group flex items-center justify-between gap-2 rounded-2xl border px-3.5 py-3 transition-colors",
                prepToneClass(item.tone)
              )}
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
                    prepIconClass(item.tone)
                  )}
                >
                  {item.tone === "ready" ? (
                    <Check className="h-4 w-4" strokeWidth={2.5} />
                  ) : (
                    <item.icon className="h-4 w-4" />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block text-[14px] font-semibold text-ink-900">{item.label}</span>
                  <span className="block text-[12.5px] leading-snug text-ink-500">{item.detail}</span>
                </span>
              </span>
              <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-ink-400 transition-colors group-hover:text-ink-700" />
            </Link>
          ))}
        </div>
      </div>

      <WorkInstructions
        title="Market this listing from the file"
        steps={[
          "Set the campaign days, and pick which ones show on Overview",
          "Tick each launch step as you finish it",
          "Log the open house, then the follow-up",
        ]}
        externalNote="Posting still happens in the MLS and on social. Record what you did here."
      />

      <div className="rounded-2xl border border-hairline bg-canvas/40 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-wide text-ink-500">Launch progress</p>
            <p className="mt-1 max-w-xl text-[14px] leading-snug text-ink-600">
              Required steps are what make this listing Ready. Optional steps are extras.
            </p>
          </div>
          {live && (
            <Badge variant="green" size="xs">
              Listing is live
            </Badge>
          )}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-hairline bg-surface px-3.5 py-3">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-[13px] font-semibold text-ink-900">Required</p>
              <p className="tnum text-[22px] font-bold leading-none tracking-[-0.03em] text-ink-950">
                {requiredDone}
                <span className="text-[14px] font-semibold text-ink-400"> / {requiredTotal}</span>
              </p>
            </div>
            <Progress
              className="mt-2.5"
              value={requiredPct}
              barClassName={requiredLeft === 0 ? "from-emerald-500 to-emerald-600" : undefined}
            />
            <p className="mt-2 text-[12.5px] text-ink-500">
              {requiredLeft === 0 ? "All required steps are done." : `${requiredLeft} still to do before Ready.`}
            </p>
          </div>
          <div className="rounded-xl border border-hairline bg-surface px-3.5 py-3">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-[13px] font-semibold text-ink-900">Optional</p>
              <p className="tnum text-[22px] font-bold leading-none tracking-[-0.03em] text-ink-950">
                {optionalDone}
                <span className="text-[14px] font-semibold text-ink-400"> / {optionalTotal}</span>
              </p>
            </div>
            <Progress className="mt-2.5" value={optionalPct} barClassName="from-ink-300 to-ink-400" />
            <p className="mt-2 text-[12.5px] text-ink-500">These never block Ready.</p>
          </div>
        </div>
      </div>

      <MarketingDatesCard
        dates={draft.dates}
        goLiveFallback={file.listingDetails.publishedAt}
        notes={draft.dateNotes ?? {}}
        hidden={draft.hiddenOverviewDates ?? []}
        customDates={draft.customDates ?? []}
        nextOpenHouse={upcomingHouse}
        onChangeDate={setDate}
        onChangeNote={setDateNote}
        onToggleOverview={toggleOverviewDate}
        onAddCustom={addCustomDate}
        onUpdateCustom={updateCustomDate}
        onRemoveCustom={removeCustomDate}
        onClearPreset={clearPresetDate}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[14px] font-semibold text-ink-950">Launch steps</p>
          <p className="text-[12.5px] text-ink-500">
            This switch changes the steps right here, and the open-house follow-ups below.
          </p>
        </div>
        <Segmented
          size="sm"
          value={layout}
          onChange={changeLayout}
          options={[
            { value: "cards", label: "Cards", icon: LayoutGrid },
            { value: "list", label: "List", icon: List },
          ]}
        />
      </div>

      {layout === "cards" ? (
        <CardsLayout
          groups={groups}
          keep={keep}
          keepDone={keepDone}
          live={live}
          sheetLive={sheetLive}
          onToggle={togglePoint}
        />
      ) : (
        <ListLayout
          groups={groups}
          keep={keep}
          keepDone={keepDone}
          live={live}
          sheetLive={sheetLive}
          onToggle={togglePoint}
        />
      )}

      <Textarea
        id="campaign-notes"
        label="Campaign notes"
        rows={2}
        value={draft.campaignNotes}
        onChange={(e) => setDraft({ ...draft, campaignNotes: e.target.value })}
      />

      <section className="overflow-hidden rounded-2xl border border-hairline bg-surface">
        <header className="flex items-center gap-2 border-b border-hairline px-4 py-3">
          <CalendarDays className="h-4 w-4 text-ink-500" />
          <p className="text-[14px] font-semibold text-ink-950">Open houses</p>
        </header>
        <div className="space-y-4 p-4">
          <div className="rounded-xl border border-dashed border-hairline bg-canvas/40 p-3.5">
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
                  const house: OpenHouse = {
                    id: uuid(),
                    date: new Date(oh.date).toISOString(),
                    startTime: oh.startTime,
                    endTime: oh.endTime,
                    visitors: oh.visitors,
                    notes: oh.notes,
                    onMls: false,
                    socialReminder: false,
                    neighborsInvited: false,
                    thankYouSent: false,
                    sellerTold: false,
                  };
                  setDraft({ ...draft, openHouses: [house, ...draft.openHouses] });
                  setOh({ date: "", startTime: "1:00 PM", endTime: "3:00 PM", visitors: 0, notes: "" });
                }}
              >
                <Plus className="h-4 w-4" />
                Log open house
              </Button>
            </div>
          </div>

          {draft.openHouses.length === 0 ? (
            <p className="text-[14px] text-ink-500">No open houses logged yet.</p>
          ) : (
            <div className="space-y-3">
              {draft.openHouses.map((h) => {
                const steps = openHouseSteps(h);
                const houseDone = steps.filter((s) => s.done).length;
                return (
                  <div key={h.id} className="rounded-xl border border-hairline bg-canvas/30 p-3.5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-[14px] font-semibold text-ink-900">
                          {new Date(h.date).toLocaleDateString()} · {h.startTime}–{h.endTime}
                        </p>
                        <p className="mt-0.5 text-[13px] text-ink-500">
                          {h.visitors} visitors{h.notes ? ` — ${h.notes}` : ""}
                        </p>
                      </div>
                      <span className="tnum rounded-full bg-surface px-2.5 py-0.5 text-[12.5px] font-semibold text-ink-600 ring-1 ring-inset ring-hairline">
                        {houseDone}/{steps.length} follow-ups
                      </span>
                    </div>
                    {layout === "cards" ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {steps.map((step) => (
                          <ToggleChip
                            key={step.key}
                            label={step.label}
                            done={step.done}
                            onToggle={() => patchHouse(h.id, step.key)}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="mt-3 divide-y divide-hairline overflow-hidden rounded-xl border border-hairline bg-surface">
                        {steps.map((step) => (
                          <ListRow
                            key={step.key}
                            label={step.label}
                            done={step.done}
                            onToggle={() => patchHouse(h.id, step.key)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

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

function dateInputValue(iso?: string) {
  if (!iso) return "";
  try {
    return format(parseISO(iso), "yyyy-MM-dd");
  } catch {
    return "";
  }
}

function prettyDate(iso?: string) {
  if (!iso) return "Not set";
  try {
    return format(parseISO(iso), "EEE, MMM d, yyyy");
  } catch {
    return "Not set";
  }
}

function phraseClass(kind: "empty" | "today" | "upcoming" | "past") {
  if (kind === "today") return "text-amber-700";
  if (kind === "upcoming") return "text-itera-700";
  if (kind === "past") return "text-ink-500";
  return "text-ink-400";
}

function OverviewToggle({
  on,
  onClick,
  needsDate = false,
}: {
  on: boolean;
  onClick: () => void;
  needsDate?: boolean;
}) {
  const label = needsDate ? "Needs a date" : on ? "On overview" : "Off overview";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={needsDate}
      aria-pressed={!needsDate && on}
      title={
        needsDate
          ? "Pick a date first. Then you can show this day on Overview."
          : "Turn this day on or off on the Overview page."
      }
      className={cn(
        "shrink-0 rounded-full px-2.5 py-1 text-[12px] font-semibold ring-1 ring-inset",
        needsDate
          ? "cursor-not-allowed bg-canvas text-ink-400 ring-hairline"
          : on
            ? "bg-itera-50 text-itera-800 ring-itera-200"
            : "bg-canvas text-ink-500 ring-hairline hover:text-ink-800"
      )}
    >
      {label}
    </button>
  );
}

function MarketingDatesCard({
  dates,
  goLiveFallback,
  notes,
  hidden,
  customDates,
  nextOpenHouse,
  onChangeDate,
  onChangeNote,
  onToggleOverview,
  onAddCustom,
  onUpdateCustom,
  onRemoveCustom,
  onClearPreset,
}: {
  dates: MarketingDates;
  /** Publish time from the listing sheet. It is not a calendar day until the user saves Go live. */
  goLiveFallback?: string;
  notes: Partial<Record<MarketingDateKey, string>>;
  hidden: MarketingDateKey[];
  customDates: CustomMarketingDate[];
  nextOpenHouse?: OpenHouse;
  onChangeDate: (key: MarketingDateKey, value: string) => void;
  onChangeNote: (key: MarketingDateKey, note: string) => void;
  onToggleOverview: (key: MarketingDateKey) => void;
  onAddCustom: (input: { label: string; date: string; note: string; showOnOverview: boolean }) => void;
  onUpdateCustom: (id: string, patch: Partial<CustomMarketingDate>) => void;
  onRemoveCustom: (id: string) => void;
  onClearPreset: (key: MarketingDateKey) => void;
}) {
  const [opened, setOpened] = useState<MarketingDateKey[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [picked, setPicked] = useState("");
  const [custom, setCustom] = useState({ label: "", date: "", note: "", showOnOverview: true });

  const fromData = MARKETING_DATE_FIELDS.filter(
    (field) =>
      !MAIN_MARKETING_DATE_KEYS.includes(field.key) &&
      (Boolean(dates[field.key]) || Boolean(notes[field.key]?.trim()))
  ).map((field) => field.key);
  const extraKeys = [...new Set([...opened, ...fromData])];
  const visible = [
    ...MARKETING_DATE_FIELDS.filter((field) => MAIN_MARKETING_DATE_KEYS.includes(field.key)),
    ...MARKETING_DATE_FIELDS.filter((field) => extraKeys.includes(field.key)),
  ];
  const available = MARKETING_DATE_FIELDS.filter((field) => !visible.some((shown) => shown.key === field.key));
  const onOverview =
    visible.filter((field) => dates[field.key] && !hidden.includes(field.key)).length +
    customDates.filter((day) => day.date && day.showOnOverview).length;

  const closeAdd = () => {
    setAddOpen(false);
    setPicked("");
    setCustom({ label: "", date: "", note: "", showOnOverview: true });
  };

  const addPicked = () => {
    if (!picked || !available.some((field) => field.key === picked)) return;
    setOpened((current) => [...current, picked as MarketingDateKey]);
    closeAdd();
  };

  const removePreset = (key: MarketingDateKey) => {
    setOpened((current) => current.filter((item) => item !== key));
    onClearPreset(key);
  };

  const saveCustom = () => {
    if (!custom.label.trim() || !custom.date) return;
    onAddCustom(custom);
    closeAdd();
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-hairline bg-surface">
      <header className="flex flex-wrap items-start justify-between gap-2 border-b border-hairline px-4 py-3">
        <div className="flex items-start gap-2">
          <CalendarDays className="mt-0.5 h-4 w-4 text-ink-500" />
          <div>
            <p className="text-[14px] font-semibold text-ink-950">Campaign calendar</p>
            <p className="max-w-xl text-[12.5px] leading-snug text-ink-500">
              Three main days are here. Add another from the list, or write your own.
            </p>
          </div>
        </div>
        <span className="tnum shrink-0 text-[12.5px] font-semibold text-ink-500">
          {onOverview === 0 ? "None on Overview" : `${onOverview} on Overview`}
        </span>
      </header>

      <div className="space-y-3 p-4">
        {visible.map((field) => {
          const phrase = campaignDatePhrase(dates[field.key]);
          const shown = !hidden.includes(field.key);
          const canRemove = !MAIN_MARKETING_DATE_KEYS.includes(field.key);
          return (
            <div key={field.key} className="rounded-xl border border-hairline bg-canvas/40 px-3.5 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-ink-900">{field.label}</p>
                  <p className="text-[12.5px] leading-snug text-ink-500">{field.hint}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <OverviewToggle
                    on={shown}
                    needsDate={!dates[field.key]}
                    onClick={() => onToggleOverview(field.key)}
                  />
                  {canRemove && (
                    <button
                      type="button"
                      onClick={() => removePreset(field.key)}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-ink-400 ring-1 ring-inset ring-hairline hover:bg-surface hover:text-ink-700"
                      aria-label={`Remove ${field.label}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <p className={cn("mt-1.5 text-[12.5px] font-medium", phraseClass(phrase.kind))}>{phrase.label}</p>
              {field.key === "goLiveAt" && !dates.goLiveAt && goLiveFallback ? (
                <p className="mt-1 text-[12.5px] leading-snug text-ink-500">
                  The listing sheet is already live ({prettyDate(goLiveFallback)}). Add that day here if you want it on Overview.
                </p>
              ) : null}
              <div className="mt-2.5 grid gap-2 sm:grid-cols-[11.5rem_1fr]">
                <Input
                  id={`mkt-date-${field.key}`}
                  aria-label={`${field.label} date`}
                  type="date"
                  value={dateInputValue(dates[field.key])}
                  onChange={(e) => onChangeDate(field.key, e.target.value)}
                />
                <Input
                  id={`mkt-note-${field.key}`}
                  aria-label={`${field.label} note`}
                  value={notes[field.key] ?? ""}
                  placeholder="What happens this day"
                  onChange={(e) => onChangeNote(field.key, e.target.value)}
                />
              </div>
            </div>
          );
        })}

        {customDates.map((item) => {
          const phrase = campaignDatePhrase(item.date);
          return (
            <div key={item.id} className="rounded-xl border border-hairline bg-canvas/40 px-3.5 py-3">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <Input
                    id={`custom-label-${item.id}`}
                    aria-label="Day name"
                    value={item.label}
                    placeholder="Name this day"
                    onChange={(e) => onUpdateCustom(item.id, { label: e.target.value })}
                    className="font-semibold"
                  />
                </div>
                <OverviewToggle
                  on={item.showOnOverview}
                  needsDate={!item.date}
                  onClick={() => onUpdateCustom(item.id, { showOnOverview: !item.showOnOverview })}
                />
                <button
                  type="button"
                  onClick={() => onRemoveCustom(item.id)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-ink-400 ring-1 ring-inset ring-hairline hover:bg-surface hover:text-ink-700"
                  aria-label="Remove this day"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <p className={cn("mt-2 text-[12.5px] font-medium", phraseClass(phrase.kind))}>{phrase.label}</p>
              <div className="mt-2.5 grid gap-2 sm:grid-cols-[11.5rem_1fr]">
                <Input
                  id={`custom-date-${item.id}`}
                  aria-label="Date"
                  type="date"
                  value={dateInputValue(item.date)}
                  onChange={(e) =>
                    onUpdateCustom(item.id, {
                      date: e.target.value ? new Date(`${e.target.value}T12:00:00`).toISOString() : undefined,
                    })
                  }
                />
                <Input
                  id={`custom-note-${item.id}`}
                  aria-label="What happens this day"
                  value={item.note}
                  placeholder="What happens this day"
                  onChange={(e) => onUpdateCustom(item.id, { note: e.target.value })}
                />
              </div>
            </div>
          );
        })}

        <div className="flex justify-end">
          <Button variant="secondary" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" />
            Add a date
          </Button>
        </div>
      </div>

      <Modal
        open={addOpen}
        onClose={closeAdd}
        title="Add a date"
        description="Pick a common day, or write your own."
        size="sm"
      >
        <div className="space-y-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <Select
                id="add-common-date"
                label="Common day"
                value={picked}
                onChange={(e) => setPicked(e.target.value)}
                disabled={available.length === 0}
              >
                <option value="">{available.length === 0 ? "All common days are already here" : "Choose a day"}</option>
                {available.map((field) => (
                  <option key={field.key} value={field.key}>
                    {field.label}
                  </option>
                ))}
              </Select>
            </div>
            <Button onClick={addPicked} disabled={!picked}>
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-hairline" />
            <span className="text-[12px] font-semibold uppercase tracking-wide text-ink-400">or write your own</span>
            <div className="h-px flex-1 bg-hairline" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              id="custom-new-label"
              label="Name"
              value={custom.label}
              placeholder="Photo day"
              onChange={(e) => setCustom({ ...custom, label: e.target.value })}
            />
            <Input
              id="custom-new-date"
              label="Date"
              type="date"
              value={custom.date}
              onChange={(e) => setCustom({ ...custom, date: e.target.value })}
            />
            <Input
              id="custom-new-note"
              label="What happens"
              className="sm:col-span-2"
              value={custom.note}
              placeholder="Photographer arrives at 9am"
              onChange={(e) => setCustom({ ...custom, note: e.target.value })}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <OverviewToggle
              on={custom.showOnOverview}
              onClick={() => setCustom({ ...custom, showOnOverview: !custom.showOnOverview })}
            />
            <Button onClick={saveCustom} disabled={!custom.label.trim() || !custom.date}>
              <Plus className="h-4 w-4" />
              Add day
            </Button>
          </div>
        </div>
      </Modal>

      <div className="border-t border-hairline bg-canvas/30 px-4 py-3 text-[12.5px] leading-relaxed text-ink-500">
        Overview lists a day only when it has a date and this says On overview.
        {nextOpenHouse
          ? ` The next open house (${prettyDate(nextOpenHouse.date)}) shows in Up next, on its own.`
          : " The next open house shows in Up next, on its own."}
      </div>
    </section>
  );
}

function CardsLayout({
  groups,
  keep,
  keepDone,
  live,
  sheetLive,
  onToggle,
}: {
  groups: ReturnType<typeof launchGroups>;
  keep: MarketingPoint[];
  keepDone: number;
  live: boolean;
  sheetLive: boolean;
  onToggle: (point: MarketingPoint) => void;
}) {
  return (
    <>
      <div className="grid gap-4 lg:grid-cols-3">
        {groups.map((group) => {
          const groupDone = group.points.filter((p) => p.done).length;
          return (
            <section key={group.id} className="overflow-hidden rounded-2xl border border-hairline bg-surface">
              <header className="border-b border-hairline px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[14px] font-semibold text-ink-950">{group.title}</p>
                    <p className="mt-0.5 text-[12.5px] text-ink-500">{group.hint}</p>
                  </div>
                  <span className="tnum shrink-0 text-[12.5px] font-semibold text-ink-500">
                    {groupDone}/{group.points.length}
                  </span>
                </div>
              </header>
              <div className="flex flex-wrap gap-2 p-3.5">
                {group.points.map((point) => (
                  <ToggleChip
                    key={point.id}
                    label={point.label}
                    done={point.done}
                    optional={point.optional}
                    locked={sheetLive && point.id === "mlsLive"}
                    onToggle={() => onToggle(point)}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {live && (
        <section className="overflow-hidden rounded-2xl border border-hairline bg-surface">
          <header className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-3">
            <div>
              <p className="text-[14px] font-semibold text-ink-950">Keep it going</p>
              <p className="mt-0.5 text-[12.5px] text-ink-500">Weekly care after the launch</p>
            </div>
            <span className="tnum text-[12.5px] font-semibold text-ink-500">
              {keepDone}/{keep.length}
            </span>
          </header>
          <div className="flex flex-wrap gap-2 p-3.5">
            {keep.map((point) => (
              <ToggleChip key={point.id} label={point.label} done={point.done} onToggle={() => onToggle(point)} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function ListLayout({
  groups,
  keep,
  keepDone,
  live,
  sheetLive,
  onToggle,
}: {
  groups: ReturnType<typeof launchGroups>;
  keep: MarketingPoint[];
  keepDone: number;
  live: boolean;
  sheetLive: boolean;
  onToggle: (point: MarketingPoint) => void;
}) {
  return (
    <div className="space-y-4">
      {groups.map((group) => {
        const groupDone = group.points.filter((p) => p.done).length;
        return (
          <section key={group.id} className="overflow-hidden rounded-2xl border border-hairline bg-surface">
            <header className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-3">
              <div>
                <p className="text-[14px] font-semibold text-ink-950">{group.title}</p>
                <p className="mt-0.5 text-[12.5px] text-ink-500">{group.hint}</p>
              </div>
              <span className="tnum text-[12.5px] font-semibold text-ink-500">
                {groupDone}/{group.points.length}
              </span>
            </header>
            <div className="divide-y divide-hairline">
              {group.points.map((point) => (
                <ListRow
                  key={point.id}
                  label={point.label}
                  done={point.done}
                  optional={point.optional}
                  locked={sheetLive && point.id === "mlsLive"}
                  onToggle={() => onToggle(point)}
                />
              ))}
            </div>
          </section>
        );
      })}

      {live && (
        <section className="overflow-hidden rounded-2xl border border-hairline bg-surface">
          <header className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-3">
            <div>
              <p className="text-[14px] font-semibold text-ink-950">Keep it going</p>
              <p className="mt-0.5 text-[12.5px] text-ink-500">Weekly care after the launch</p>
            </div>
            <span className="tnum text-[12.5px] font-semibold text-ink-500">
              {keepDone}/{keep.length}
            </span>
          </header>
          <div className="divide-y divide-hairline">
            {keep.map((point) => (
              <ListRow key={point.id} label={point.label} done={point.done} onToggle={() => onToggle(point)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ToggleChip({
  label,
  done,
  optional,
  locked,
  onToggle,
}: {
  label: string;
  done: boolean;
  optional?: boolean;
  locked?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      disabled={locked}
      onClick={onToggle}
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-full px-3 py-1.5 text-left text-[13px] font-semibold ring-1 ring-inset transition-colors",
        done
          ? "bg-itera-50 text-itera-800 ring-itera-200"
          : "bg-canvas text-ink-600 ring-hairline hover:bg-surface hover:text-ink-900",
        locked && "cursor-default opacity-80"
      )}
    >
      <span
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
          done ? "bg-itera-600 text-white" : "bg-ink-100 text-transparent"
        )}
      >
        <Check className="h-2.5 w-2.5" strokeWidth={3} />
      </span>
      <span className="min-w-0 truncate">{label}</span>
      {optional && !done && (
        <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">Opt</span>
      )}
      {locked && <span className="text-[11px] font-medium text-ink-400">Sheet</span>}
    </button>
  );
}

function ListRow({
  label,
  done,
  optional,
  locked,
  onToggle,
}: {
  label: string;
  done: boolean;
  optional?: boolean;
  locked?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      disabled={locked}
      onClick={onToggle}
      className={cn(
        "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
        done ? "bg-itera-50/40" : "bg-surface hover:bg-canvas/60",
        locked && "cursor-default"
      )}
    >
      <span
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-md ring-1 ring-inset",
          done ? "bg-itera-600 text-white ring-itera-600" : "bg-canvas text-transparent ring-hairline"
        )}
      >
        <Check className="h-3 w-3" strokeWidth={3} />
      </span>
      <span className="min-w-0 flex-1 text-[14px] font-medium text-ink-900">{label}</span>
      {optional && (
        <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">Optional</span>
      )}
      {locked && <span className="text-[12px] font-medium text-ink-400">On listing sheet</span>}
      <span className={cn("text-[12.5px] font-semibold", done ? "text-itera-700" : "text-ink-400")}>
        {done ? "Done" : "Todo"}
      </span>
    </button>
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
