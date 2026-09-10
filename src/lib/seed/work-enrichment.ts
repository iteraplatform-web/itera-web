import { subDays } from "date-fns";
import { v4 as uuid } from "uuid";
import type { TransactionFile } from "@/types";

/** Rich work history for the Maple Court under-contract demo file. */
export function enrichMapleCourt(file: TransactionFile): void {
  file.clientProfile = {
    relationshipHistory: "Past clients from 2019 purchase on Laurel Street. Referred two neighbors.",
    goals: "Sell and downsize closer to grandchildren in Round Rock.",
    timeline: "Prefer closing before end of month if possible.",
    preferredContact: "Email",
    preferredContactTime: "Weekday mornings",
    updatedAt: subDays(new Date(), 50).toISOString(),
  };

  file.cma = {
    comps: [
      {
        id: uuid(),
        address: "711 Cedar Lane, Round Rock",
        salePrice: 475000,
        soldDate: subDays(new Date(), 45).toISOString(),
        beds: 3,
        baths: 2,
        sqft: 1850,
        adjustment: 8000,
        notes: "Similar vintage, renovated kitchen",
      },
      {
        id: uuid(),
        address: "902 Elm Street, Round Rock",
        salePrice: 502000,
        soldDate: subDays(new Date(), 60).toISOString(),
        beds: 4,
        baths: 2,
        sqft: 2100,
        adjustment: -12000,
        notes: "Larger lot; subtract for size",
      },
      {
        id: uuid(),
        address: "640 Maple Court, Round Rock",
        salePrice: 468000,
        soldDate: subDays(new Date(), 30).toISOString(),
        beds: 3,
        baths: 2,
        sqft: 1720,
        adjustment: 15000,
        notes: "Same street — strongest comp",
      },
    ],
    recommendedPrice: 489000,
    pricingNotes: "Priced at the top of the adjusted range given curb appeal and updated baths.",
    presentedAt: subDays(new Date(), 48).toISOString(),
    sellerResponse: "Agreed to list at $489,000",
    updatedAt: subDays(new Date(), 48).toISOString(),
  };

  file.listingDetails = {
    beds: 3,
    baths: 2,
    sqft: 1840,
    lotSize: "0.22 acres",
    yearBuilt: 1961,
    propertyType: "Single Family",
    features: "Updated baths, covered patio, mature oaks, two-car garage",
    publicRemarks:
      "Charming mid-century home on a quiet Round Rock cul-de-sac. Fresh baths, shaded backyard, and walkable to neighborhood parks. Pre-1978 — lead disclosure attached.",
    privateRemarks: "Lockbox on side gate. Sellers prefer weekday showings after 10am.",
    publishStatus: "published_external",
    publishedAt: subDays(new Date(), 40).toISOString(),
    updatedAt: subDays(new Date(), 40).toISOString(),
  };

  file.propertyPrep = {
    items: [
      { id: uuid(), title: "Replace cracked driveway panel", category: "repair", status: "done" },
      { id: uuid(), title: "Touch-up front door paint", category: "curb", status: "done" },
      { id: uuid(), title: "Declutter garage for photos", category: "staging", status: "done" },
      { id: uuid(), title: "Pressure-wash patio", category: "curb", status: "deferred", notes: "Deferred to buyer credit" },
    ],
    photoReady: true,
    stagingPlan: "Neutral throws, cleared counters, fresh flowers for shoot day.",
    updatedAt: subDays(new Date(), 42).toISOString(),
  };

  file.media = {
    photographerName: "Brightline Media",
    shootDate: subDays(new Date(), 41).toISOString(),
    accessNotes: "Key under mat if lockbox busy — confirm with James.",
    shots: [
      { id: uuid(), label: "Front elevation", selected: true },
      { id: uuid(), label: "Kitchen", selected: true },
      { id: uuid(), label: "Primary suite", selected: true },
      { id: uuid(), label: "Backyard", selected: true },
      { id: uuid(), label: "Twilight exterior", selected: false },
    ],
    updatedAt: subDays(new Date(), 41).toISOString(),
  };

  file.showings = {
    lockboxCode: "4821",
    showingWindows: "Mon–Sat 10am–6pm; Sundays by appointment",
    noticeHours: 2,
    petInstructions: "No pets on site",
    alarmInstructions: "Alarm off during showing windows",
    appointments: [
      {
        id: uuid(),
        scheduledAt: subDays(new Date(), 28).toISOString(),
        agentOrBuyer: "Nova RE — Whitfield",
        feedback: "Liked layout; concerned about age of HVAC",
        sentiment: "warm",
      },
      {
        id: uuid(),
        scheduledAt: subDays(new Date(), 22).toISOString(),
        agentOrBuyer: "Rivera Household",
        feedback: "Second showing — ready to write",
        sentiment: "hot",
      },
      {
        id: uuid(),
        scheduledAt: subDays(new Date(), 18).toISOString(),
        agentOrBuyer: "Compass — Patel",
        feedback: "Passed — needed a fourth bedroom",
        sentiment: "pass",
      },
    ],
    updatedAt: subDays(new Date(), 18).toISOString(),
  };

  file.marketing = {
    syndicatedPortals: ["Zillow", "Realtor.com", "Redfin", "Brokerage site"],
    socialPosted: true,
    emailAnnouncementSent: true,
    openHouses: [
      {
        id: uuid(),
        date: subDays(new Date(), 35).toISOString(),
        startTime: "1:00 PM",
        endTime: "3:00 PM",
        visitors: 11,
        notes: "Two follow-up showings booked",
      },
    ],
    campaignNotes: "Boosted Instagram carousel week one.",
    updatedAt: subDays(new Date(), 30).toISOString(),
  };

  file.agreements = file.agreements.map((a) =>
    a.kind === "listing"
      ? {
          ...a,
          listPrice: 489000,
          commissionRate: 0.025,
          termStart: subDays(new Date(), 50).toISOString(),
          termEnd: subDays(new Date(), -40).toISOString(),
          executedAt: subDays(new Date(), 50).toISOString(),
          status: "executed" as const,
          notes: "6-month listing term",
        }
      : a
  );

  file.milestones = file.milestones.map((m) => {
    if (m.taskId === "earnest_money") {
      return {
        ...m,
        status: "complete",
        completedAt: subDays(new Date(), 9).toISOString(),
        notes: "Title confirmed $7,500 wire",
        outcome: "Received",
      };
    }
    if (m.taskId === "inspection") {
      return {
        ...m,
        status: "complete",
        scheduledAt: subDays(new Date(), 8).toISOString(),
        completedAt: subDays(new Date(), 6).toISOString(),
        notes: "Water heater + 2 GFCIs — $2,400 credit",
        outcome: "Credit negotiated",
      };
    }
    if (m.taskId === "title_search") {
      return {
        ...m,
        status: "complete",
        completedAt: subDays(new Date(), 5).toISOString(),
        notes: "Clear commitment; no material exceptions",
        outcome: "Clear",
      };
    }
    if (m.taskId === "appraisal") {
      return {
        ...m,
        status: "complete",
        completedAt: subDays(new Date(), 2).toISOString(),
        notes: "Appraised at contract price",
        outcome: "$489,000",
      };
    }
    if (m.taskId === "financing_contingency") {
      return { ...m, status: "in_progress", notes: "Awaiting clear-to-close letter" };
    }
    if (m.taskId === "closing_data_sheet") {
      return { ...m, status: "scheduled", scheduledAt: subDays(new Date(), -3).toISOString() };
    }
    return m;
  });
}

/** Active listing with showings underway. */
export function enrichOakwood(file: TransactionFile): void {
  file.clientProfile = {
    relationshipHistory: "Met at open house on Barton Hills; followed up same week.",
    goals: "Sell current home and buy closer to campus for son's senior year.",
    timeline: "Want under contract within 45 days if possible.",
    preferredContact: "Text",
    preferredContactTime: "Evenings after 6pm",
    updatedAt: subDays(new Date(), 20).toISOString(),
  };

  file.cma = {
    comps: [
      {
        id: uuid(),
        address: "1901 Oakwood Drive",
        salePrice: 610000,
        soldDate: subDays(new Date(), 25).toISOString(),
        beds: 3,
        baths: 2.5,
        sqft: 2200,
        adjustment: 5000,
      },
      {
        id: uuid(),
        address: "88 South 1st Street",
        salePrice: 640000,
        soldDate: subDays(new Date(), 40).toISOString(),
        beds: 4,
        baths: 3,
        sqft: 2450,
        adjustment: -18000,
      },
    ],
    recommendedPrice: 625000,
    pricingNotes: "Strong 78704 demand; hold list price through first two weekends.",
    presentedAt: subDays(new Date(), 19).toISOString(),
    sellerResponse: "Agreed",
    updatedAt: subDays(new Date(), 19).toISOString(),
  };

  file.listingDetails = {
    beds: 3,
    baths: 2.5,
    sqft: 2280,
    lotSize: "0.18 acres",
    yearBuilt: 1998,
    propertyType: "Single Family",
    features: "Open kitchen, covered patio, walkable to South Congress",
    publicRemarks:
      "Light-filled Travis Heights adjacent home with an open plan and a private backyard. Ideal for buyers who want 78704 without the condo HOA.",
    privateRemarks: "Biscuit crated during showings — 2hr notice required.",
    publishStatus: "published_external",
    publishedAt: subDays(new Date(), 14).toISOString(),
    updatedAt: subDays(new Date(), 14).toISOString(),
  };

  file.propertyPrep = {
    items: [
      { id: uuid(), title: "Power-wash driveway", category: "curb", status: "done" },
      { id: uuid(), title: "Stage living room seating", category: "staging", status: "done" },
      { id: uuid(), title: "Replace weatherstrip on back door", category: "repair", status: "agreed" },
    ],
    photoReady: true,
    stagingPlan: "Minimal furniture package from StageCraft.",
    updatedAt: subDays(new Date(), 16).toISOString(),
  };

  file.media = {
    photographerName: "Lens & Lot",
    shootDate: subDays(new Date(), 15).toISOString(),
    accessNotes: "Seller leaves side gate unlocked for shoot crew.",
    shots: [
      { id: uuid(), label: "Front elevation", selected: true },
      { id: uuid(), label: "Kitchen", selected: true },
      { id: uuid(), label: "Primary suite", selected: true },
      { id: uuid(), label: "Backyard", selected: true },
      { id: uuid(), label: "Twilight exterior", selected: true },
    ],
    updatedAt: subDays(new Date(), 15).toISOString(),
  };

  file.showings = {
    lockboxCode: "7193",
    showingWindows: "Daily 10am–7pm with 2 hours notice",
    noticeHours: 2,
    petInstructions: "Biscuit crated in laundry — do not let out",
    alarmInstructions: "Code 3344; disarm panel by garage",
    appointments: [
      {
        id: uuid(),
        scheduledAt: subDays(new Date(), 10).toISOString(),
        agentOrBuyer: "Keller Williams — Ng",
        feedback: "Loved kitchen; asking about fence height",
        sentiment: "hot",
      },
      {
        id: uuid(),
        scheduledAt: subDays(new Date(), 8).toISOString(),
        agentOrBuyer: "Private buyer — Morales",
        feedback: "Considering; comparing two others",
        sentiment: "warm",
      },
      {
        id: uuid(),
        scheduledAt: subDays(new Date(), 5).toISOString(),
        agentOrBuyer: "eXp — Cho",
        feedback: "Cool on price vs. finishes",
        sentiment: "cool",
      },
      {
        id: uuid(),
        scheduledAt: subDays(new Date(), 3).toISOString(),
        agentOrBuyer: "Second showing — Ng clients",
        feedback: "Writing this week",
        sentiment: "hot",
      },
    ],
    updatedAt: subDays(new Date(), 3).toISOString(),
  };

  file.marketing = {
    syndicatedPortals: ["Zillow", "Realtor.com", "Redfin"],
    socialPosted: true,
    emailAnnouncementSent: true,
    openHouses: [
      {
        id: uuid(),
        date: subDays(new Date(), 9).toISOString(),
        startTime: "12:00 PM",
        endTime: "3:00 PM",
        visitors: 14,
        notes: "Two writing this week",
      },
    ],
    campaignNotes: "Featured in Saturday brokerage email blast.",
    updatedAt: subDays(new Date(), 7).toISOString(),
  };

  file.agreements = file.agreements.map((a) =>
    a.kind === "listing"
      ? {
          ...a,
          listPrice: 625000,
          commissionRate: 0.03,
          executedAt: subDays(new Date(), 20).toISOString(),
          status: "executed" as const,
          notes: "",
        }
      : a
  );
}

/** Buyer search file with criteria and shortlist. */
export function enrichMarcusBuyer(file: TransactionFile): void {
  file.clientProfile = {
    relationshipHistory: "Corporate referral from Anchor Relocation.",
    goals: "Find a 3/2 in Cedar Park with strong schools under $470K.",
    timeline: "Need to be under contract within 60 days of start date.",
    preferredContact: "Phone",
    preferredContactTime: "Lunch hour",
    updatedAt: subDays(new Date(), 15).toISOString(),
  };

  file.buyerSearch = {
    minPrice: 400000,
    maxPrice: 470000,
    bedsMin: 3,
    bathsMin: 2,
    areas: "Cedar Park, Brushy Creek, north Leander",
    mustHaves: "Leander ISD, 2-car garage, backyard for dog",
    dealBreakers: "HOA over $80/mo, busy arterial frontage",
    alertsEnabled: true,
    shortlist: [
      {
        id: uuid(),
        address: "412 Brushy Creek Rd",
        notes: "Great schools; kitchen dated",
        interest: "warm",
      },
      {
        id: uuid(),
        address: "88 Twin Lakes",
        notes: "Favorite so far — want second look",
        interest: "hot",
      },
    ],
    updatedAt: subDays(new Date(), 4).toISOString(),
  };

  file.showings = {
    ...file.showings,
    appointments: [
      {
        id: uuid(),
        scheduledAt: subDays(new Date(), 6).toISOString(),
        agentOrBuyer: "Marcus Williams",
        propertyAddress: "412 Brushy Creek Rd",
        feedback: "Liked yard; kitchen needs work",
        sentiment: "warm",
      },
      {
        id: uuid(),
        scheduledAt: subDays(new Date(), 2).toISOString(),
        agentOrBuyer: "Marcus Williams",
        propertyAddress: "88 Twin Lakes",
        feedback: "Strong contender",
        sentiment: "hot",
      },
    ],
    updatedAt: subDays(new Date(), 2).toISOString(),
  };

  file.milestones = file.milestones.map((m) =>
    m.taskId === "buyer_preapproval"
      ? {
          ...m,
          status: "complete",
          completedAt: subDays(new Date(), 12).toISOString(),
          notes: "Approved to $510K — targeting under $470K",
          outcome: "$510,000",
        }
      : m
  );

  file.agreements = file.agreements.map((a) => {
    if (a.kind === "buyer") {
      return { ...a, status: "executed", executedAt: subDays(new Date(), 14).toISOString(), notes: "" };
    }
    if (a.kind === "referral") {
      return {
        ...a,
        status: "executed",
        executedAt: subDays(new Date(), 15).toISOString(),
        referralPercentage: 25,
        notes: "Anchor Relocation — 25%",
      };
    }
    return a;
  });
}

/** Closed listing — full history for analytics. */
export function enrichShoalCreek(file: TransactionFile): void {
  file.clientProfile = {
    relationshipHistory: "Instagram lead from listing ad; first-time seller.",
    goals: "Sell and relocate to Houston for work.",
    timeline: "Flexible — prioritized clean close.",
    preferredContact: "Email",
    preferredContactTime: "Anytime",
    updatedAt: subDays(new Date(), 90).toISOString(),
  };

  file.cma = {
    comps: [
      {
        id: uuid(),
        address: "5600 Shoal Creek",
        salePrice: 390000,
        soldDate: subDays(new Date(), 100).toISOString(),
        beds: 3,
        baths: 2,
        sqft: 1600,
        adjustment: 4000,
      },
    ],
    recommendedPrice: 399000,
    pricingNotes: "Listed at $399K; accepted $395K cash.",
    presentedAt: subDays(new Date(), 90).toISOString(),
    sellerResponse: "Agreed",
    updatedAt: subDays(new Date(), 90).toISOString(),
  };

  file.listingDetails = {
    beds: 3,
    baths: 2,
    sqft: 1580,
    yearBuilt: 1985,
    propertyType: "Single Family",
    features: "Updated kitchen, covered patio",
    publicRemarks: "Move-in ready Allandale adjacent home with a quiet backyard.",
    privateRemarks: "",
    publishStatus: "published_external",
    publishedAt: subDays(new Date(), 80).toISOString(),
    updatedAt: subDays(new Date(), 80).toISOString(),
  };

  file.showings = {
    lockboxCode: "2201",
    showingWindows: "Daily with notice",
    noticeHours: 1,
    petInstructions: "",
    alarmInstructions: "",
    appointments: [
      {
        id: uuid(),
        scheduledAt: subDays(new Date(), 55).toISOString(),
        agentOrBuyer: "Cash buyer — Delgado",
        feedback: "Wrote same day",
        sentiment: "hot",
      },
      {
        id: uuid(),
        scheduledAt: subDays(new Date(), 58).toISOString(),
        agentOrBuyer: "Local agent tour",
        feedback: "Price felt right",
        sentiment: "warm",
      },
    ],
    updatedAt: subDays(new Date(), 55).toISOString(),
  };

  file.marketing = {
    syndicatedPortals: ["Zillow", "Realtor.com"],
    socialPosted: true,
    emailAnnouncementSent: true,
    openHouses: [],
    campaignNotes: "Closed fast — cash offer week two.",
    updatedAt: subDays(new Date(), 50).toISOString(),
  };

  file.milestones = file.milestones.map((m) => ({
    ...m,
    status: "complete" as const,
    completedAt: subDays(new Date(), 10).toISOString(),
    notes: m.notes || "Complete",
  }));

  file.propertyPrep = {
    items: [{ id: uuid(), title: "Minor paint touch-ups", category: "staging", status: "done" }],
    photoReady: true,
    stagingPlan: "Seller-staged",
    updatedAt: subDays(new Date(), 85).toISOString(),
  };

  file.media = {
    photographerName: "HouseFrame Co",
    shootDate: subDays(new Date(), 82).toISOString(),
    accessNotes: "",
    shots: [
      { id: uuid(), label: "Front elevation", selected: true },
      { id: uuid(), label: "Kitchen", selected: true },
      { id: uuid(), label: "Primary suite", selected: true },
      { id: uuid(), label: "Backyard", selected: true },
      { id: uuid(), label: "Twilight exterior", selected: false },
    ],
    updatedAt: subDays(new Date(), 82).toISOString(),
  };
}
