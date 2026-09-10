import { v4 as uuid } from "uuid";
import type {
  AgreementRecord,
  BuyerSearchWork,
  ClientProfileWork,
  CmaWork,
  IntakeAnswers,
  ListingDetailsWork,
  MarketingWork,
  MediaWork,
  MilestoneRecord,
  PropertyPrepWork,
  ShowingsWork,
  TransactionFile,
  TransactionSide,
} from "@/types";

export function emptyClientProfile(answers?: Partial<IntakeAnswers>): ClientProfileWork {
  return {
    relationshipHistory: "",
    goals: "",
    timeline: "",
    preferredContact: answers?.preferredContact ?? "",
    preferredContactTime: answers?.preferredContactTime ?? "",
  };
}

export function emptyCma(): CmaWork {
  return {
    comps: [],
    recommendedPrice: 0,
    pricingNotes: "",
  };
}

export function emptyListingDetails(): ListingDetailsWork {
  return {
    beds: 0,
    baths: 0,
    sqft: 0,
    propertyType: "Single Family",
    features: "",
    publicRemarks: "",
    privateRemarks: "",
    publishStatus: "draft",
  };
}

export function emptyPropertyPrep(): PropertyPrepWork {
  return {
    items: [],
    photoReady: false,
    stagingPlan: "",
  };
}

export function emptyMedia(): MediaWork {
  return {
    photographerName: "",
    accessNotes: "",
    shots: [
      { id: uuid(), label: "Front elevation", selected: false },
      { id: uuid(), label: "Kitchen", selected: false },
      { id: uuid(), label: "Primary suite", selected: false },
      { id: uuid(), label: "Backyard", selected: false },
      { id: uuid(), label: "Twilight exterior", selected: false },
    ],
  };
}

export function emptyShowings(): ShowingsWork {
  return {
    lockboxCode: "",
    showingWindows: "",
    noticeHours: 2,
    petInstructions: "",
    alarmInstructions: "",
    appointments: [],
  };
}

export function emptyMarketing(): MarketingWork {
  return {
    syndicatedPortals: [],
    socialPosted: false,
    emailAnnouncementSent: false,
    openHouses: [],
    campaignNotes: "",
  };
}

export function emptyBuyerSearch(): BuyerSearchWork {
  return {
    minPrice: 0,
    maxPrice: 0,
    bedsMin: 0,
    bathsMin: 0,
    areas: "",
    mustHaves: "",
    dealBreakers: "",
    alertsEnabled: false,
    shortlist: [],
  };
}

const LISTING_MILESTONES: { taskId: string; title: string }[] = [
  { taskId: "earnest_money", title: "Earnest money" },
  { taskId: "title_search", title: "Title search" },
  { taskId: "inspection", title: "Home inspection" },
  { taskId: "appraisal", title: "Appraisal" },
  { taskId: "financing_contingency", title: "Financing contingency" },
  { taskId: "closing_data_sheet", title: "Closing data sheet" },
  { taskId: "utilities_transfer", title: "Utility transfer" },
  { taskId: "final_walkthrough", title: "Final walkthrough" },
  { taskId: "closing", title: "Closing" },
  { taskId: "post_close_followup", title: "Post-close follow-up" },
  { taskId: "file_archive", title: "File archive" },
];

const BUYING_MILESTONES: { taskId: string; title: string }[] = [
  { taskId: "buyer_preapproval", title: "Buyer pre-approval" },
  { taskId: "earnest_money_buyer", title: "Earnest money delivery" },
  { taskId: "inspection_buyer", title: "Home inspection" },
  { taskId: "appraisal_buyer", title: "Appraisal" },
  { taskId: "title_review_buyer", title: "Title review" },
  { taskId: "financing_buyer", title: "Clear to close" },
  { taskId: "insurance_buyer", title: "Homeowners insurance" },
  { taskId: "final_walkthrough_buyer", title: "Final walkthrough" },
  { taskId: "closing_buyer", title: "Closing" },
  { taskId: "post_close_followup_buyer", title: "Post-close follow-up" },
];

export function defaultMilestones(side: TransactionSide): MilestoneRecord[] {
  const list = side === "listing" ? LISTING_MILESTONES : BUYING_MILESTONES;
  return list.map((m) => ({
    id: uuid(),
    taskId: m.taskId,
    title: m.title,
    status: "not_started",
    notes: "",
  }));
}

export function defaultAgreements(answers: IntakeAnswers): AgreementRecord[] {
  const records: AgreementRecord[] = [];
  if (answers.side === "listing") {
    records.push({
      id: uuid(),
      kind: "listing",
      listPrice: 0,
      commissionRate: 0.03,
      notes: "",
      status: "draft",
    });
  } else {
    records.push({
      id: uuid(),
      kind: "buyer",
      notes: "",
      status: "draft",
    });
  }
  if (answers.isReferral) {
    records.push({
      id: uuid(),
      kind: "referral",
      referralPercentage: answers.referralPercentage ?? 0,
      notes: answers.referralSource ? `Source: ${answers.referralSource}` : "",
      status: "draft",
    });
  }
  if (answers.isRelocation) {
    records.push({
      id: uuid(),
      kind: "relocation",
      notes: "",
      status: "draft",
    });
  }
  return records;
}

export function createDefaultWorkFields(answers: IntakeAnswers): Pick<
  TransactionFile,
  | "clientProfile"
  | "cma"
  | "listingDetails"
  | "propertyPrep"
  | "media"
  | "showings"
  | "marketing"
  | "buyerSearch"
  | "milestones"
  | "agreements"
  | "photos"
  | "customFields"
  | "reminders"
> {
  return {
    clientProfile: emptyClientProfile(answers),
    cma: emptyCma(),
    listingDetails: emptyListingDetails(),
    propertyPrep: emptyPropertyPrep(),
    media: emptyMedia(),
    showings: emptyShowings(),
    marketing: emptyMarketing(),
    buyerSearch: emptyBuyerSearch(),
    milestones: defaultMilestones(answers.side),
    agreements: defaultAgreements(answers),
    photos: [],
    customFields: [],
    reminders: [],
  };
}

/** Backfill work fields for files persisted before this feature shipped. */
export function ensureWorkFields(file: TransactionFile): TransactionFile {
  const answers: IntakeAnswers = {
    clientName: file.clientName,
    phone: file.phone,
    email: file.email,
    side: file.side,
    propertyAddress: file.propertyAddress,
    isReferral: file.isReferral,
    isRelocation: file.isRelocation,
    builtBefore1978: file.builtBefore1978,
    referralSource: file.referralSource,
    referralPercentage: file.referralPercentage,
    preferredContact: file.preferredContact,
    preferredContactTime: file.preferredContactTime,
  };
  const defaults = createDefaultWorkFields(answers);
  return {
    ...file,
    preferredContactTime: file.preferredContactTime ?? "",
    clientProfile: file.clientProfile ?? defaults.clientProfile,
    cma: file.cma ?? defaults.cma,
    listingDetails: file.listingDetails ?? defaults.listingDetails,
    propertyPrep: file.propertyPrep ?? defaults.propertyPrep,
    media: file.media
      ? {
          ...defaults.media,
          ...file.media,
          shots: file.media.shots?.length ? file.media.shots : defaults.media.shots,
        }
      : defaults.media,
    showings: file.showings ?? defaults.showings,
    marketing: file.marketing ?? defaults.marketing,
    buyerSearch: file.buyerSearch ?? defaults.buyerSearch,
    milestones: file.milestones?.length ? file.milestones : defaults.milestones,
    agreements: file.agreements?.length ? file.agreements : defaults.agreements,
    photos: file.photos ?? [],
    customFields: file.customFields ?? [],
    reminders: file.reminders ?? [],
  };
}
