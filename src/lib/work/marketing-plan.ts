import { differenceInCalendarDays, format, parseISO } from "date-fns";
import type { MarketingDates, MarketingWork, OpenHouse } from "@/types";

export type MarketingDateKey = keyof MarketingDates;

export const MARKETING_DATE_FIELDS: {
  key: MarketingDateKey;
  label: string;
  hint: string;
}[] = [
  { key: "comingSoonAt", label: "Coming soon", hint: "The day a teaser goes out, before the home is public." },
  { key: "goLiveAt", label: "Go live", hint: "The day the home hits the MLS and the big sites." },
  { key: "brokerTourAt", label: "Broker tour", hint: "The day other agents walk through the home." },
  { key: "sellerUpdateAt", label: "Seller update", hint: "The day you send the seller a note about showings." },
  { key: "refreshPostAt", label: "Refresh post", hint: "The day a fresh post goes out after the first week." },
  { key: "priceTalkAt", label: "Price talk", hint: "The day you talk about price with the seller." },
];

/** The days that always show. The rest are added from the list. */
export const MAIN_MARKETING_DATE_KEYS: MarketingDateKey[] = ["comingSoonAt", "goLiveAt", "brokerTourAt"];

/** How far a campaign day is from today, in plain words. */
export function campaignDatePhrase(iso?: string): {
  kind: "empty" | "today" | "upcoming" | "past";
  label: string;
} {
  if (!iso) return { kind: "empty", label: "No date yet" };
  try {
    const day = parseISO(iso);
    if (Number.isNaN(day.getTime())) return { kind: "empty", label: "No date yet" };
    const diff = differenceInCalendarDays(day, new Date());
    const pretty = format(day, "EEE, MMM d, yyyy");
    if (diff === 0) return { kind: "today", label: `Today · ${pretty}` };
    if (diff === 1) return { kind: "upcoming", label: `Tomorrow · ${pretty}` };
    if (diff > 1) return { kind: "upcoming", label: `In ${diff} days · ${pretty}` };
    if (diff === -1) return { kind: "past", label: `Yesterday · ${pretty}` };
    return { kind: "past", label: `${Math.abs(diff)} days ago · ${pretty}` };
  } catch {
    return { kind: "empty", label: "No date yet" };
  }
}

/** Sites that count toward "on a major site." Brokerage and Facebook do not. */
export const BIG_PORTALS = ["Zillow", "Realtor.com", "Redfin", "Homes.com"] as const;

const PORTAL_IDS = [
  "Zillow",
  "Realtor.com",
  "Redfin",
  "Homes.com",
  "Brokerage site",
  "Facebook Marketplace",
] as const;

export type MarketingFlag =
  | "comingSoon"
  | "mlsLive"
  | "emailAnnouncementSent"
  | "agentEmailSent"
  | "socialPosted"
  | "yardSign"
  | "flyer"
  | "videoTour"
  | "adBoost"
  | "sellerUpdate"
  | "refreshPost"
  | "priceTalk";

export type OpenHouseStepKey = "onMls" | "socialReminder" | "neighborsInvited" | "thankYouSent" | "sellerTold";

export type MarketingPoint = {
  id: string;
  label: string;
  optional?: boolean;
  done: boolean;
};

export function isPortalPoint(id: string): boolean {
  return (PORTAL_IDS as readonly string[]).includes(id);
}

export type LaunchGroup = {
  id: string;
  title: string;
  hint: string;
  points: MarketingPoint[];
};

export function launchGroups(m: MarketingWork, listingPublished: boolean): LaunchGroup[] {
  const on = (name: string) => m.syndicatedPortals.includes(name);
  return [
    {
      id: "web",
      title: "On the web",
      hint: "MLS and the sites buyers search",
      points: [
        { id: "comingSoon", label: "Coming-soon peek", optional: true, done: m.comingSoon },
        { id: "mlsLive", label: "Live on the MLS", done: listingPublished || m.mlsLive },
        { id: "Zillow", label: "Zillow", done: on("Zillow") },
        { id: "Realtor.com", label: "Realtor.com", done: on("Realtor.com") },
        { id: "Redfin", label: "Redfin", done: on("Redfin") },
        { id: "Homes.com", label: "Homes.com", done: on("Homes.com") },
        { id: "Brokerage site", label: "Brokerage site", done: on("Brokerage site") },
        { id: "Facebook Marketplace", label: "Facebook", optional: true, done: on("Facebook Marketplace") },
      ],
    },
    {
      id: "announce",
      title: "Tell people",
      hint: "Email and social announcement",
      points: [
        { id: "emailAnnouncementSent", label: "Just-listed email", done: m.emailAnnouncementSent },
        { id: "agentEmailSent", label: "Email to other agents", done: m.agentEmailSent },
        { id: "socialPosted", label: "Social post", done: m.socialPosted },
        { id: "adBoost", label: "Small ad boost", optional: true, done: m.adBoost },
      ],
    },
    {
      id: "ground",
      title: "At the house",
      hint: "Sign, flyer, and video",
      points: [
        { id: "yardSign", label: "Yard sign up", done: m.yardSign },
        { id: "flyer", label: "One-page flyer", done: m.flyer },
        { id: "videoTour", label: "Walkthrough video", done: m.videoTour },
      ],
    },
  ];
}

export function launchPoints(m: MarketingWork, listingPublished: boolean): MarketingPoint[] {
  return launchGroups(m, listingPublished).flatMap((g) => g.points);
}

export function keepGoingPoints(m: MarketingWork): MarketingPoint[] {
  return [
    { id: "sellerUpdate", label: "Seller got an update this week", done: m.sellerUpdate },
    { id: "refreshPost", label: "A fresh post went out", done: m.refreshPost },
    { id: "priceTalk", label: "Price talk if showings are quiet", done: m.priceTalk },
  ];
}

export function openHouseSteps(h: OpenHouse): { key: OpenHouseStepKey; label: string; done: boolean }[] {
  return [
    { key: "onMls", label: "Date is on the MLS", done: h.onMls },
    { key: "socialReminder", label: "Social reminder posted", done: h.socialReminder },
    { key: "neighborsInvited", label: "Neighbors invited", done: h.neighborsInvited },
    { key: "thankYouSent", label: "Thank-you sent", done: h.thankYouSent },
    { key: "sellerTold", label: "Seller told the visitor count", done: h.sellerTold },
  ];
}

/** Prefer the saved go-live date; fall back to the listing sheet publish time. */
export function resolveMarketingDates(m: MarketingWork, publishedAt?: string): MarketingDates {
  return {
    ...m.dates,
    goLiveAt: m.dates.goLiveAt || publishedAt,
  };
}

/** Soonest open house on today or later. */
export function nextOpenHouse(houses: OpenHouse[]): OpenHouse | undefined {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return [...houses]
    .filter((h) => new Date(h.date).getTime() >= start.getTime())
    .sort((a, b) => a.date.localeCompare(b.date))[0];
}

export type OverviewMarketingRow = {
  id: string;
  label: string;
  iso?: string;
  detail?: string;
  note?: string;
  upcoming?: boolean;
};

function hiddenDateKeys(m: MarketingWork): Set<MarketingDateKey> {
  return new Set(m.hiddenOverviewDates ?? []);
}

/**
 * Days that actually belong on Overview.
 * A day is included only when it has its own date and the user left it on.
 * The listing publish time and the next open house are not slipped in here.
 */
export function overviewMarketingRows(m: MarketingWork, _publishedAt?: string): OverviewMarketingRow[] {
  const hidden = hiddenDateKeys(m);
  const rows: OverviewMarketingRow[] = [];

  for (const field of MARKETING_DATE_FIELDS) {
    const iso = m.dates[field.key];
    if (!iso || hidden.has(field.key)) continue;
    rows.push({
      id: field.key,
      label: field.label,
      iso,
      note: m.dateNotes?.[field.key]?.trim() || undefined,
    });
  }

  for (const custom of m.customDates ?? []) {
    if (!custom.date || !custom.showOnOverview) continue;
    rows.push({
      id: custom.id,
      label: custom.label.trim() || "Campaign day",
      iso: custom.date,
      note: custom.note?.trim() || undefined,
    });
  }

  return rows;
}

/** Dates that already have a value, newest campaign order. */
export function overviewMarketingFilled(
  m: MarketingWork,
  publishedAt?: string
): OverviewMarketingRow[] {
  return overviewMarketingRows(m, publishedAt)
    .filter((r) => Boolean(r.iso))
    .sort((a, b) => (a.iso && b.iso ? a.iso.localeCompare(b.iso) : 0));
}

/** Main days still missing a date, and not hidden from Overview. */
export function overviewMarketingPending(
  m: MarketingWork,
  publishedAt?: string
): string[] {
  const dates = resolveMarketingDates(m, publishedAt);
  const hidden = hiddenDateKeys(m);
  return MARKETING_DATE_FIELDS.filter(
    (f) => MAIN_MARKETING_DATE_KEYS.includes(f.key) && !dates[f.key] && !hidden.has(f.key)
  ).map((f) => f.label);
}

/** Most recent past open house, if any. */
export function lastOpenHouse(houses: OpenHouse[]): OpenHouse | undefined {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return [...houses]
    .filter((h) => new Date(h.date).getTime() < start.getTime())
    .sort((a, b) => b.date.localeCompare(a.date))[0];
}
