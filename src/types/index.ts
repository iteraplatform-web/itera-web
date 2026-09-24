export type TransactionStatus =
  | "prospective"
  | "listed"
  | "buyer_agency"
  | "in_progress"
  | "under_contract"
  | "closed"
  | "dropped"
  | "terminated";

export type TransactionSide = "listing" | "buying";

export type TaskStatus = "not_started" | "in_progress" | "completed" | "blocked";

export type ChecklistPhase =
  | "intake"
  | "listing_prep"
  | "marketing"
  | "offers"
  | "under_contract"
  | "closing"
  | "post_close";

export type DocumentCategory =
  | "disclosures"
  | "hoa"
  | "permits"
  | "receipts"
  | "closing";

export type DocumentStatus = "received" | "needed";

export type EarnestMoneyStatus = "received" | "pending";

export type NotificationType = "urgent" | "info" | "success";

export type DashboardView = "cards" | "table" | "kanban" | "calendar";

export type WorkspaceSection =
  | "overview"
  | "checklist"
  | "client_profile"
  | "pricing"
  | "listing_details"
  | "property_work"
  | "showings"
  | "marketing"
  | "documents"
  | "photos"
  | "communications"
  | "financials"
  | "milestones"
  | "notes"
  | "analytics"
  | "client_view";

export type WorkDeepRoute = "pricing" | "listing" | "analytics";

export type WorkReadiness = "empty" | "in_progress" | "ready";

export interface User {
  id: string;
  name: string;
  email: string;
  brokerage?: string;
  markets?: string[];
  onboarded: boolean;
  /** The agent's share of gross commission after the brokerage split, e.g. 80. */
  agentSplit?: number;
  /** Flat per-transaction fee charged by the brokerage. */
  transactionFee?: number;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface TaskWorkTarget {
  section: WorkspaceSection;
  route?: WorkDeepRoute;
  /** Button text on the checklist, e.g. "Upload the listing agreement". */
  label?: string;
  /** A document name, email template id, or named control to open and highlight. */
  focus?: string;
}

export interface ChecklistTask {
  id: string;
  title: string;
  description: string;
  phase: ChecklistPhase;
  status: TaskStatus;
  dependsOn: string[];
  subtasks: Subtask[];
  dueDate?: string;
  addedBecause?: string;
  completedAt?: string;
  completedBy?: string;
  /** Where the agent captures this task's work inside ITERA. */
  workTarget?: TaskWorkTarget;
}

export interface Document {
  id: string;
  name: string;
  /** Follows the brokerage's existing naming pattern, e.g.
   *  "1842-Oakwood-Dr_Lead-Paint-Disclosure_2026-09-08.pdf" */
  fileName: string;
  category: DocumentCategory;
  status: DocumentStatus;
  /** Who the document is expected from, shown while it is still outstanding. */
  expectedFrom?: string;
  receivedAt?: string;
  receivedBy?: string;
  sizeKb?: number;
  /** Key of the uploaded file in the browser's IndexedDB, when one exists. */
  blobId?: string;
  /** The name the file had on the agent's computer before renaming. */
  originalName?: string;
  mimeType?: string;
}

export interface Photo {
  id: string;
  name: string;
  sizeKb: number;
  width: number;
  height: number;
  uploadedAt: string;
  uploadedBy: string;
  caption?: string;
  /** Full-size image (downscaled to at most 1600px) in IndexedDB. */
  blobId: string;
  /** Small preview used in grids, also in IndexedDB. */
  thumbBlobId: string;
}

export type CustomFieldType = "text" | "number" | "date" | "yesno";

/** Anything about a client that the standard intake does not have a slot for. */
export interface CustomField {
  id: string;
  label: string;
  value: string;
  type: CustomFieldType;
  /** Pinned fields show on the file's Overview. */
  pinned: boolean;
  createdAt: string;
  /** Set when the field arrived from a spreadsheet import. */
  source?: "manual" | "import";
}

export interface Reminder {
  id: string;
  title: string;
  dueAt: string;
  note?: string;
  done: boolean;
  /** When the scheduler raised the notification for it. */
  firedAt?: string;
  createdAt: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

export interface SentEmail {
  id: string;
  templateId: string;
  subject: string;
  sentAt: string;
  sentBy: string;
}

export interface Message {
  id: string;
  sender: "agent" | "client";
  content: string;
  sentAt: string;
}

export interface Note {
  id: string;
  content: string;
  author: string;
  createdAt: string;
}

export type ActivityType =
  | "task_completed"
  | "status_change"
  | "document_received"
  | "note_added"
  | "message_sent"
  | "cma_updated"
  | "listing_updated"
  | "showing_logged"
  | "marketing_updated"
  | "milestone_updated"
  | "profile_updated"
  | "prep_updated"
  | "media_updated"
  | "agreement_updated"
  | "automation"
  | "photo_added"
  | "field_changed"
  | "reminder";

export interface ActivityEntry {
  id: string;
  type: ActivityType;
  description: string;
  actor: string;
  createdAt: string;
}

export type OfferStatus = "pending" | "accepted" | "rejected" | "countered";

export type FinancingType = "cash" | "conventional" | "fha" | "va" | "other";

export const FINANCING_LABELS: Record<FinancingType, string> = {
  cash: "Cash",
  conventional: "Conventional",
  fha: "FHA",
  va: "VA",
  other: "Other",
};

export interface Offer {
  id: string;
  /** The buyer or buyer's agent the offer came from. */
  buyerName: string;
  amount: number;
  earnestMoney?: number;
  financing: FinancingType;
  /** Free-text contingencies, e.g. "Inspection, Financing, Appraisal". */
  contingencies?: string;
  proposedClosingDate?: string;
  notes?: string;
  receivedAt: string;
  status: OfferStatus;
}

export interface Financials {
  listPrice: number;
  commissionRate: number;
  earnestMoney: number;
  earnestMoneyStatus: EarnestMoneyStatus;
  referralPercentage?: number;
}

/* ── Listing / buyer work records (system of record) ─────────────────── */

export interface ClientProfileWork {
  relationshipHistory: string;
  goals: string;
  timeline: string;
  preferredContact: string;
  preferredContactTime: string;
  updatedAt?: string;
}

export interface CmaComp {
  id: string;
  address: string;
  salePrice: number;
  soldDate: string;
  beds: number;
  baths: number;
  sqft: number;
  adjustment: number;
  notes?: string;
}

export interface CmaWork {
  comps: CmaComp[];
  recommendedPrice: number;
  pricingNotes: string;
  presentedAt?: string;
  sellerResponse?: string;
  updatedAt?: string;
}

export type ListingPublishStatus = "draft" | "ready" | "published_external";

export interface ListingDetailsWork {
  beds: number;
  baths: number;
  sqft: number;
  lotSize?: string;
  yearBuilt?: number;
  propertyType: string;
  features: string;
  publicRemarks: string;
  privateRemarks: string;
  publishStatus: ListingPublishStatus;
  publishedAt?: string;
  updatedAt?: string;
}

export type PrepItemStatus = "recommended" | "agreed" | "done" | "deferred";

export interface PrepItem {
  id: string;
  title: string;
  category: "repair" | "staging" | "curb" | "other";
  status: PrepItemStatus;
  notes?: string;
}

export interface PropertyPrepWork {
  items: PrepItem[];
  photoReady: boolean;
  stagingPlan: string;
  updatedAt?: string;
}

export interface MediaShot {
  id: string;
  label: string;
  selected: boolean;
}

export interface MediaWork {
  photographerName: string;
  shootDate?: string;
  accessNotes: string;
  shots: MediaShot[];
  updatedAt?: string;
}

export type ShowingFeedbackSentiment = "hot" | "warm" | "cool" | "pass";

export interface ShowingAppointment {
  id: string;
  scheduledAt: string;
  agentOrBuyer: string;
  feedback: string;
  sentiment: ShowingFeedbackSentiment;
  /** Buying side: address of the property toured. */
  propertyAddress?: string;
}

export interface ShowingsWork {
  lockboxCode: string;
  showingWindows: string;
  noticeHours: number;
  petInstructions: string;
  alarmInstructions: string;
  appointments: ShowingAppointment[];
  updatedAt?: string;
}

export interface OpenHouse {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  visitors: number;
  notes?: string;
}

export interface MarketingWork {
  syndicatedPortals: string[];
  socialPosted: boolean;
  emailAnnouncementSent: boolean;
  openHouses: OpenHouse[];
  campaignNotes: string;
  updatedAt?: string;
}

export interface BuyerSearchWork {
  minPrice: number;
  maxPrice: number;
  bedsMin: number;
  bathsMin: number;
  areas: string;
  mustHaves: string;
  dealBreakers: string;
  alertsEnabled: boolean;
  shortlist: { id: string; address: string; notes: string; interest: ShowingFeedbackSentiment }[];
  updatedAt?: string;
}

export type MilestoneStatus = "not_started" | "scheduled" | "in_progress" | "complete" | "waived";

export interface MilestoneRecord {
  id: string;
  /** Matches checklist task id when applicable. */
  taskId: string;
  title: string;
  status: MilestoneStatus;
  scheduledAt?: string;
  completedAt?: string;
  notes: string;
  outcome?: string;
}

export type AgreementKind = "listing" | "buyer" | "referral" | "relocation";

export interface AgreementRecord {
  id: string;
  kind: AgreementKind;
  listPrice?: number;
  termStart?: string;
  termEnd?: string;
  commissionRate?: number;
  referralPercentage?: number;
  executedAt?: string;
  notes: string;
  status: "draft" | "sent" | "executed";
}

export interface IntakeAnswers {
  clientName: string;
  phone: string;
  email: string;
  side: TransactionSide;
  propertyAddress: string;
  isReferral: boolean;
  isRelocation: boolean;
  builtBefore1978?: boolean;
  referralSource?: string;
  referralPercentage?: number;
  leadSource?: string;
  coClientName?: string;
  coClientContact?: string;
  websiteOrSocial?: string;
  petNames?: string;
  preferredContact?: string;
  preferredContactTime?: string;
}

export interface TransactionFile {
  id: string;
  clientName: string;
  phone: string;
  email: string;
  side: TransactionSide;
  propertyAddress: string;
  status: TransactionStatus;
  isReferral: boolean;
  isRelocation: boolean;
  builtBefore1978?: boolean;
  referralSource?: string;
  referralPercentage?: number;
  leadSource?: string;
  coClientName?: string;
  coClientContact?: string;
  websiteOrSocial?: string;
  petNames?: string;
  preferredContact?: string;
  preferredContactTime?: string;
  isQuickLead: boolean;
  listPrice: number;
  closingDate?: string;
  createdAt: string;
  updatedAt: string;
  checklist: ChecklistTask[];
  documents: Document[];
  sentEmails: SentEmail[];
  messages: Message[];
  notes: Note[];
  activity: ActivityEntry[];
  offers: Offer[];
  financials: Financials;
  clientProfile: ClientProfileWork;
  cma: CmaWork;
  listingDetails: ListingDetailsWork;
  propertyPrep: PropertyPrepWork;
  media: MediaWork;
  showings: ShowingsWork;
  marketing: MarketingWork;
  buyerSearch: BuyerSearchWork;
  milestones: MilestoneRecord[];
  agreements: AgreementRecord[];
  photos: Photo[];
  coverPhotoId?: string;
  customFields: CustomField[];
  reminders: Reminder[];
  /** Date the contract was executed; the option period and earnest money run from it. */
  contractDate?: string;
  /** The client's own sign-in to the portal. Created as soon as the file has an email. */
  portalAccess?: PortalAccess;
}

/**
 * What the client can see is the agent's choice — the roadmap's "client view
 * management". Everything defaults on except money estimates, which some
 * agents prefer to walk through in person.
 */
export interface PortalVisibility {
  progress: boolean;
  documents: boolean;
  property: boolean;
  showingFeedback: boolean;
  money: boolean;
}

export interface PortalAccess {
  email: string;
  /** Demo only: shown to the agent so the portal can be tested. A real build
   *  sends a sign-in link and never stores or displays a password. */
  password: string;
  enabled: boolean;
  createdAt: string;
  invitedAt?: string;
  lastSignInAt?: string;
  visibility: PortalVisibility;
}

export interface Notification {
  id: string;
  fileId?: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
  /** Prevents the scheduler raising the same alert twice. */
  dedupeKey?: string;
}

export interface PortfolioStats {
  openFiles: number;
  closingsThisMonth: number;
  overdueCount: number;
}

export interface PortfolioWorkStats {
  avgDaysOnMarket: number | null;
  showingsToOfferRate: number | null;
  totalShowings: number;
  filesMissingCma: number;
  filesMissingListingSheet: number;
  pipelineValue: number;
}

export interface ChecklistTemplateRule {
  id: string;
  taskTitle: string;
  phase: ChecklistPhase;
  /** Plain-English statement of when this task is included. */
  appliesWhen: string;
  isConditional: boolean;
  dependsOnTitles: string[];
  subtaskCount: number;
}

export interface UrgentItem {
  fileId: string;
  fileLabel: string;
  taskTitle: string;
  daysRemaining: number;
  isOverdue: boolean;
}

/**
 * One line in the cross-portfolio task list — a checklist task or a
 * reminder, from any file, normalized so the two can sort and render
 * together. Nothing lives here that isn't already on the file; this is a
 * view over existing data, not a new store of truth.
 */
export interface PortfolioActionItem {
  id: string;
  kind: "task" | "reminder";
  fileId: string;
  fileLabel: string;
  clientName: string;
  title: string;
  dueDate: string;
  daysRemaining: number;
  isOverdue: boolean;
  phase?: ChecklistPhase;
  section: WorkspaceSection;
  focus?: string;
}

export const DEMO_CREDENTIALS = {
  email: "demo@itera.app",
  password: "demo1234",
} as const;

export const STATUS_LABELS: Record<TransactionStatus, string> = {
  prospective: "Prospective",
  listed: "Listed",
  buyer_agency: "Buyer Agency",
  in_progress: "In Progress",
  under_contract: "Under Contract",
  closed: "Closed",
  dropped: "Dropped",
  terminated: "Terminated",
};

export const PHASE_LABELS: Record<ChecklistPhase, string> = {
  intake: "Intake",
  listing_prep: "Listing Prep",
  marketing: "Marketing",
  offers: "Offers",
  under_contract: "Under Contract",
  closing: "Closing",
  post_close: "Post Close",
};

export const SECTION_LABELS: Record<WorkspaceSection, string> = {
  overview: "Overview",
  checklist: "Checklist",
  client_profile: "Client Profile",
  pricing: "Pricing / CMA",
  listing_details: "Listing Details",
  property_work: "Prep & Photos",
  showings: "Showings",
  marketing: "Marketing",
  documents: "Documents",
  photos: "Photos",
  communications: "Communications",
  financials: "Financials",
  milestones: "Milestones",
  notes: "Notes & Activity",
  analytics: "Analytics",
  client_view: "Client View",
};
