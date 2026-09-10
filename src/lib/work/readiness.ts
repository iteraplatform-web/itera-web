import type {
  BuyerSearchWork,
  ClientProfileWork,
  CmaWork,
  ListingDetailsWork,
  MarketingWork,
  MediaWork,
  MilestoneRecord,
  PropertyPrepWork,
  ShowingsWork,
  TransactionFile,
  WorkReadiness,
} from "@/types";

export function clientProfileReadiness(p: ClientProfileWork): WorkReadiness {
  const filled = [p.goals, p.timeline, p.relationshipHistory, p.preferredContact].filter(
    (v) => v.trim().length > 0
  ).length;
  if (filled === 0) return "empty";
  if (filled >= 3 && p.preferredContact.trim()) return "ready";
  return "in_progress";
}

export function cmaReadiness(c: CmaWork): WorkReadiness {
  if (c.comps.length === 0 && !c.recommendedPrice) return "empty";
  if (c.comps.length >= 2 && c.recommendedPrice > 0 && c.presentedAt) return "ready";
  return "in_progress";
}

export function listingReadiness(l: ListingDetailsWork): WorkReadiness {
  if (!l.beds && !l.sqft && !l.publicRemarks.trim()) return "empty";
  if (
    l.beds > 0 &&
    l.baths > 0 &&
    l.sqft > 0 &&
    l.publicRemarks.trim().length > 20 &&
    (l.publishStatus === "ready" || l.publishStatus === "published_external")
  ) {
    return "ready";
  }
  return "in_progress";
}

export function propertyPrepReadiness(p: PropertyPrepWork): WorkReadiness {
  if (p.items.length === 0 && !p.stagingPlan.trim()) return "empty";
  if (p.photoReady && p.items.length > 0) return "ready";
  return "in_progress";
}

export function mediaReadiness(m: MediaWork): WorkReadiness {
  const selected = m.shots.filter((s) => s.selected).length;
  if (!m.photographerName && selected === 0) return "empty";
  if (m.photographerName && selected >= 3) return "ready";
  return "in_progress";
}

export function showingsReadiness(s: ShowingsWork, side: "listing" | "buying"): WorkReadiness {
  if (side === "listing") {
    if (!s.lockboxCode && !s.showingWindows && s.appointments.length === 0) return "empty";
    if (s.lockboxCode && s.showingWindows) return "ready";
    return "in_progress";
  }
  if (s.appointments.length === 0) return "empty";
  if (s.appointments.length >= 1) return "ready";
  return "in_progress";
}

export function marketingReadiness(m: MarketingWork): WorkReadiness {
  if (
    m.syndicatedPortals.length === 0 &&
    !m.socialPosted &&
    !m.emailAnnouncementSent &&
    m.openHouses.length === 0
  ) {
    return "empty";
  }
  if (m.syndicatedPortals.length > 0 && (m.socialPosted || m.openHouses.length > 0)) return "ready";
  return "in_progress";
}

export function buyerSearchReadiness(b: BuyerSearchWork): WorkReadiness {
  if (!b.maxPrice && !b.areas.trim() && b.shortlist.length === 0) return "empty";
  if (b.maxPrice > 0 && b.areas.trim() && b.alertsEnabled) return "ready";
  return "in_progress";
}

export function milestonesReadiness(milestones: MilestoneRecord[]): WorkReadiness {
  const touched = milestones.filter((m) => m.status !== "not_started").length;
  if (touched === 0) return "empty";
  const complete = milestones.filter((m) => m.status === "complete" || m.status === "waived").length;
  if (complete === milestones.length) return "ready";
  return "in_progress";
}

export function daysOnMarket(file: TransactionFile): number | null {
  if (file.side !== "listing") return null;
  if (!["listed", "under_contract", "closed", "terminated"].includes(file.status)) return null;
  const listedActivity = file.activity.find(
    (a) =>
      a.type === "listing_updated" &&
      a.description.toLowerCase().includes("published")
  );
  const start = listedActivity
    ? new Date(listedActivity.createdAt)
    : file.listingDetails.publishedAt
      ? new Date(file.listingDetails.publishedAt)
      : new Date(file.createdAt);
  const end =
    file.status === "closed" && file.closingDate
      ? new Date(file.closingDate)
      : file.status === "under_contract" || file.status === "terminated"
        ? new Date(file.updatedAt)
        : new Date();
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
}

export function fileAnalytics(file: TransactionFile) {
  const showings = file.showings.appointments.length;
  const sentiment = {
    hot: file.showings.appointments.filter((a) => a.sentiment === "hot").length,
    warm: file.showings.appointments.filter((a) => a.sentiment === "warm").length,
    cool: file.showings.appointments.filter((a) => a.sentiment === "cool").length,
    pass: file.showings.appointments.filter((a) => a.sentiment === "pass").length,
  };
  const offers = file.offers;
  const offerAmounts = offers.map((o) => o.amount);
  const done = file.checklist.filter((t) => t.status === "completed").length;
  const phaseProgress = file.checklist.reduce<Record<string, { done: number; total: number }>>(
    (acc, t) => {
      if (!acc[t.phase]) acc[t.phase] = { done: 0, total: 0 };
      acc[t.phase].total += 1;
      if (t.status === "completed") acc[t.phase].done += 1;
      return acc;
    },
    {}
  );

  return {
    daysOnMarket: daysOnMarket(file),
    showingCount: showings,
    sentiment,
    offerCount: offers.length,
    offerHigh: offerAmounts.length ? Math.max(...offerAmounts) : null,
    offerLow: offerAmounts.length ? Math.min(...offerAmounts) : null,
    checklistDone: done,
    checklistTotal: file.checklist.length,
    phaseProgress,
    milestones: file.milestones,
  };
}
