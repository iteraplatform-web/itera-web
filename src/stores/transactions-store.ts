import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { v4 as uuid } from "uuid";
import { addDays, format } from "date-fns";
import {
  advanceChecklistToStatus,
  applyAutomation,
  rescheduleChecklist,
  ON_DOCUMENT_RECEIVED,
  ON_EARNEST_RECEIVED,
  ON_EMAIL_SENT,
  ON_OFFER_LOGGED,
  ON_OFFER_ACCEPTED,
  ON_PHOTOS_ADDED,
  type AutomationRule,
} from "@/lib/checklist/rules";
import {
  generateChecklist,
  generateDocuments,
  buildDocumentFileName,
  fileNameBase,
  createTransactionFromIntake,
  interpolateTemplate,
  resolveTaskStatus,
  EMAIL_TEMPLATES,
  type TemplateContext,
} from "@/lib/checklist/engine";
import { SEED_TRANSACTIONS } from "@/lib/seed/data";
import { ensureWorkFields } from "@/lib/work/defaults";
import { toast } from "@/stores/toast-store";
import { STATUS_THEME } from "@/lib/utils/status-theme";
import {
  filterFiles,
  getFileById as selectFileById,
  getMostUrgentItem,
  getPortfolioStats,
} from "@/lib/selectors/transactions";
import type {
  ActivityType,
  AgreementRecord,
  BuyerSearchWork,
  ClientProfileWork,
  CmaWork,
  DashboardView,
  IntakeAnswers,
  ListingDetailsWork,
  MarketingWork,
  MediaWork,
  MilestoneRecord,
  Offer,
  OfferStatus,
  PortfolioStats,
  PropertyPrepWork,
  ShowingsWork,
  TransactionFile,
  TransactionStatus,
  UrgentItem,
  WorkspaceSection,
} from "@/types";
import type { CustomField, Message, Note, Photo, PortalVisibility, Reminder } from "@/types";
import { createPortalAccess, makeTempPassword } from "@/lib/client/access";

interface TransactionsState {
  files: TransactionFile[];
  dashboardView: DashboardView;
  statusFilter: TransactionStatus | "all";
  sideFilter: "all" | "listing" | "buying";
  searchQuery: string;
  activeWorkspaceSection: WorkspaceSection;
  initialized: boolean;
  /**
   * The last meaningful change, persisted so a second tab can tell the viewer
   * what happened after it rehydrates. This is what stands in for a websocket.
   */
  lastEvent: BroadcastEvent | null;

  initialize: () => void;
  setDashboardView: (view: DashboardView) => void;
  setStatusFilter: (status: TransactionStatus | "all") => void;
  setSideFilter: (side: "all" | "listing" | "buying") => void;
  setSearchQuery: (query: string) => void;
  setWorkspaceSection: (section: WorkspaceSection) => void;

  getFilteredFiles: () => TransactionFile[];
  getFileById: (id: string) => TransactionFile | undefined;
  getPortfolioStats: () => PortfolioStats;
  getMostUrgentItem: () => UrgentItem | null;

  createFile: (answers: IntakeAnswers) => string;
  createQuickLead: (name: string, phone: string) => string;
  updateFileStatus: (fileId: string, status: TransactionStatus, actor?: string) => void;
  toggleTask: (fileId: string, taskId: string, actor?: string) => void;
  toggleSubtask: (fileId: string, taskId: string, subtaskId: string, actor?: string) => void;
  markDocumentReceived: (
    fileId: string,
    docId: string,
    actor?: string,
    upload?: UploadMeta
  ) => void;
  sendEmail: (fileId: string, templateId: string, actor?: string) => void;
  sendMessage: (fileId: string, content: string, sender: "agent" | "client") => void;
  addNote: (fileId: string, content: string, author: string) => void;
  updateFinancials: (fileId: string, updates: Partial<TransactionFile["financials"]>) => void;

  addOffer: (fileId: string, offer: Omit<Offer, "id" | "receivedAt" | "status">) => void;
  setOfferStatus: (fileId: string, offerId: string, status: OfferStatus, actor?: string) => void;
  uploadDocument: (fileId: string, docId: string, upload: UploadMeta) => void;
  addUploadedDocument: (
    fileId: string,
    name: string,
    category: TransactionFile["documents"][number]["category"],
    upload: UploadMeta
  ) => void;
  setKeyDates: (fileId: string, dates: { contractDate?: string; closingDate?: string }) => void;
  addPhotos: (fileId: string, photos: Photo[]) => void;
  removePhoto: (fileId: string, photoId: string) => void;
  setCoverPhoto: (fileId: string, photoId: string) => void;
  updatePhotoCaption: (fileId: string, photoId: string, caption: string) => void;
  addCustomField: (fileId: string, field: Omit<CustomField, "id" | "createdAt">) => void;
  updateCustomField: (fileId: string, fieldId: string, updates: Partial<CustomField>) => void;
  removeCustomField: (fileId: string, fieldId: string) => void;
  addReminder: (fileId: string, reminder: Pick<Reminder, "title" | "dueAt" | "note">) => void;
  toggleReminder: (fileId: string, reminderId: string) => void;
  removeReminder: (fileId: string, reminderId: string) => void;
  markReminderFired: (fileId: string, reminderId: string) => void;
  updateIntakeFlags: (
    fileId: string,
    flags: Partial<Pick<IntakeAnswers, "isReferral" | "isRelocation" | "builtBefore1978" | "referralPercentage" | "referralSource">>
  ) => void;
  importFiles: (rows: ImportedFile[]) => string[];
  resetPortalPassword: (fileId: string) => void;
  setPortalEnabled: (fileId: string, enabled: boolean) => void;
  setPortalVisibility: (fileId: string, updates: Partial<PortalVisibility>) => void;
  recordClientSignIn: (fileId: string) => void;
  addDocument: (fileId: string, name: string, category: TransactionFile["documents"][number]["category"]) => void;
  completeIntake: (fileId: string, answers: IntakeAnswers) => void;

  updateClientProfile: (fileId: string, updates: Partial<ClientProfileWork>, actor?: string) => void;
  updateCma: (fileId: string, updates: Partial<CmaWork>, actor?: string) => void;
  updateListingDetails: (fileId: string, updates: Partial<ListingDetailsWork>, actor?: string) => void;
  updatePropertyPrep: (fileId: string, updates: Partial<PropertyPrepWork>, actor?: string) => void;
  updateMedia: (fileId: string, updates: Partial<MediaWork>, actor?: string) => void;
  updateShowings: (fileId: string, updates: Partial<ShowingsWork>, actor?: string) => void;
  updateMarketing: (fileId: string, updates: Partial<MarketingWork>, actor?: string) => void;
  updateBuyerSearch: (fileId: string, updates: Partial<BuyerSearchWork>, actor?: string) => void;
  updateMilestone: (fileId: string, milestoneId: string, updates: Partial<MilestoneRecord>, actor?: string) => void;
  updateAgreement: (fileId: string, agreementId: string, updates: Partial<AgreementRecord>, actor?: string) => void;
}

/** What a real upload returns: where the bytes are and what they were. */
export interface UploadMeta {
  blobId: string;
  sizeKb: number;
  originalName: string;
  mimeType: string;
}

/** A spreadsheet row, already validated and converted. */
export interface ImportedFile {
  answers: IntakeAnswers;
  status?: TransactionStatus;
  listPrice?: number;
  commissionRate?: number;
  closingDate?: string;
  note?: string;
  customFields: { label: string; value: string }[];
}

export interface BroadcastEvent {
  fileId: string;
  /** Short headline shown to the client, e.g. "Offer accepted". */
  title: string;
  message: string;
  tone: "success" | "info" | "urgent";
  at: string;
}

/** Records a change for other tabs to pick up on rehydrate. */
function broadcast(
  draft: { lastEvent: BroadcastEvent | null },
  event: Omit<BroadcastEvent, "at">
): void {
  draft.lastEvent = { ...event, at: new Date().toISOString() };
}

function pushWorkActivity(
  file: TransactionFile,
  type: ActivityType,
  description: string,
  actor: string
) {
  file.activity.unshift({
    id: uuid(),
    type,
    description,
    actor,
    createdAt: new Date().toISOString(),
  });
  file.updatedAt = new Date().toISOString();
}

/**
 * Ticks the checklist steps that a piece of work elsewhere has satisfied,
 * completes any task whose steps are now all done, and logs why. Returns what
 * it ticked so the caller can tell the agent.
 */
function runAutomation(
  file: TransactionFile,
  rules: AutomationRule[],
  reason: string,
  actor: string
): string[] {
  const ticked = applyAutomation(file.checklist, rules);
  if (ticked.length === 0) return ticked;

  const now = new Date().toISOString();
  file.checklist.forEach((task) => {
    if (task.status !== "completed" && task.subtasks.length > 0 && task.subtasks.every((st) => st.completed)) {
      task.status = "completed";
      task.completedAt = now;
      task.completedBy = actor;
    } else if (task.status === "not_started" && task.subtasks.some((st) => st.completed)) {
      task.status = "in_progress";
    }
  });
  recalculateChecklist(file);

  ticked.forEach((what) =>
    file.activity.unshift({
      id: uuid(),
      type: "automation",
      description: `Ticked automatically: ${what} (${reason})`,
      actor: "ITERA",
      createdAt: now,
    })
  );
  return ticked;
}

function announceAutomation(ticked: string[]) {
  if (ticked.length === 0) return;
  setTimeout(
    () =>
      toast.info(
        "Checklist updated",
        ticked.length === 1 ? `Ticked: ${ticked[0]}` : `${ticked.length} steps ticked automatically`
      ),
    500
  );
}

function recalculateChecklist(file: TransactionFile): void {
  file.checklist = file.checklist.map((task) => ({
    ...task,
    status: resolveTaskStatus(task, file.checklist),
  }));
}

export const useTransactionsStore = create<TransactionsState>()(
  persist(
    immer((set, get) => ({
      files: [],
      dashboardView: "cards",
      statusFilter: "all",
      sideFilter: "all",
      searchQuery: "",
      activeWorkspaceSection: "checklist",
      initialized: false,
      lastEvent: null,

      initialize: () => {
        const state = get();
        if (!state.initialized || state.files.length === 0) {
          set((s) => {
            s.files = SEED_TRANSACTIONS.map(ensureWorkFields);
            s.initialized = true;
          });
        } else {
          set((s) => {
            s.files = s.files.map(ensureWorkFields);
          });
        }
      },

      setDashboardView: (view) => set((s) => { s.dashboardView = view; }),
      setStatusFilter: (status) => set((s) => { s.statusFilter = status; }),
      setSideFilter: (side) => set((s) => { s.sideFilter = side; }),
      setSearchQuery: (query) => set((s) => { s.searchQuery = query; }),
      setWorkspaceSection: (section) => set((s) => { s.activeWorkspaceSection = section; }),

      getFilteredFiles: () => {
        const { files, statusFilter, sideFilter, searchQuery } = get();
        return filterFiles(files, statusFilter, sideFilter, searchQuery);
      },

      getFileById: (id) => selectFileById(get().files, id),

      getPortfolioStats: () => getPortfolioStats(get().files),

      getMostUrgentItem: () => getMostUrgentItem(get().files),

      createFile: (answers) => {
        const file = createTransactionFromIntake(answers);
        set((s) => { s.files.unshift(file); });
        toast.success(
          "File created",
          `Checklist built with ${file.checklist.length} tasks for ${answers.clientName}`
        );
        return file.id;
      },

      createQuickLead: (name, phone) => {
        const file = createTransactionFromIntake({
          clientName: name,
          phone,
          email: "",
          side: "listing",
          propertyAddress: "TBD",
          isReferral: false,
          isRelocation: false,
        }, { isQuickLead: true, status: "prospective" });
        set((s) => { s.files.unshift(file); });
        toast.info("Quick lead saved", `${name} added — complete intake when ready`);
        return file.id;
      },

      updateFileStatus: (fileId, status, actor = "Demo Agent") => {
        const file = get().files.find((f) => f.id === fileId);
        if (!file || file.status === status) return;

        const prev = file.status;
        const prevLabel = STATUS_THEME[prev].label;
        const newLabel = STATUS_THEME[status].label;

        set((s) => {
          const f = s.files.find((x) => x.id === fileId);
          if (!f) return;
          f.status = status;
          f.updatedAt = new Date().toISOString();
          f.activity.unshift({
            id: uuid(),
            type: "status_change",
            description: `Status changed from ${prevLabel} to ${newLabel}`,
            actor,
            createdAt: new Date().toISOString(),
          });
          broadcast(s, {
            fileId,
            title: "Status updated",
            message: `${f.propertyAddress || f.clientName} moved to ${newLabel}.`,
            tone: status === "closed" ? "success" : "info",
          });
        });
      },

      toggleTask: (fileId, taskId, actor = "Demo Agent") => {
        const file = get().files.find((f) => f.id === fileId);
        const task = file?.checklist.find((t) => t.id === taskId);
        if (!file || !task || task.status === "blocked") return;

        const completing = task.status !== "completed";

        set((s) => {
          const f = s.files.find((x) => x.id === fileId);
          const t = f?.checklist.find((x) => x.id === taskId);
          if (!f || !t) return;

          if (completing) {
            t.status = "completed";
            t.completedAt = new Date().toISOString();
            t.completedBy = actor;
            t.subtasks = t.subtasks.map((st) => ({ ...st, completed: true }));
            f.activity.unshift({
              id: uuid(),
              type: "task_completed",
              description: `Completed: ${t.title}`,
              actor,
              createdAt: new Date().toISOString(),
            });
            broadcast(s, {
              fileId,
              title: "Progress update",
              message: `${t.title} is complete.`,
              tone: "success",
            });
          } else {
            t.status = "not_started";
            t.completedAt = undefined;
            t.completedBy = undefined;
            t.subtasks = t.subtasks.map((st) => ({ ...st, completed: false }));
          }

          recalculateChecklist(f);
          f.updatedAt = new Date().toISOString();
        });

        if (completing) {
          toast.success("Task completed", task.title);
          const unlocked = file.checklist.filter(
            (t) => t.dependsOn.includes(taskId) && t.status !== "completed"
          );
          if (unlocked.length > 0) {
            setTimeout(() => {
              toast.info("Next task unlocked", unlocked[0].title);
            }, 600);
          }
        }
      },

      toggleSubtask: (fileId, taskId, subtaskId, actor = "Demo Agent") => {
        set((s) => {
          const file = s.files.find((f) => f.id === fileId);
          if (!file) return;
          const task = file.checklist.find((t) => t.id === taskId);
          if (!task || task.status === "blocked") return;
          const sub = task.subtasks.find((st) => st.id === subtaskId);
          if (!sub) return;
          sub.completed = !sub.completed;

          const allDone = task.subtasks.every((st) => st.completed);
          if (allDone) {
            task.status = "completed";
            task.completedAt = new Date().toISOString();
            task.completedBy = actor;
          } else {
            task.status = "in_progress";
          }

          recalculateChecklist(file);
          file.updatedAt = new Date().toISOString();
        });
      },

      markDocumentReceived: (fileId, docId, actor = "Demo Agent", upload) => {
        const file = get().files.find((f) => f.id === fileId);
        const doc = file?.documents.find((d) => d.id === docId);
        if (!file || !doc || doc.status === "received") return;
        let ticked: string[] = [];

        set((s) => {
          const f = s.files.find((x) => x.id === fileId);
          const d = f?.documents.find((x) => x.id === docId);
          if (!f || !d) return;
          d.status = "received";
          d.receivedAt = new Date().toISOString();
          d.receivedBy = actor;
          if (upload) {
            d.blobId = upload.blobId;
            d.sizeKb = upload.sizeKb;
            d.originalName = upload.originalName;
            d.mimeType = upload.mimeType;
            // The stored name follows the brokerage pattern, keeping the real extension.
            const ext = upload.originalName.includes(".") ? upload.originalName.split(".").pop() : "pdf";
            d.fileName = buildDocumentFileName(fileNameBase(f), d.name).replace(/\.pdf$/, `.${ext}`);
          }

          f.activity.unshift({
            id: uuid(),
            type: "document_received",
            description: `Document received: ${d.name}`,
            actor,
            createdAt: new Date().toISOString(),
          });
          f.updatedAt = new Date().toISOString();
          broadcast(s, {
            fileId,
            title: "Document received",
            message: `${d.name} has been received.`,
            tone: "info",
          });
          ticked = runAutomation(f, ON_DOCUMENT_RECEIVED[d.name] ?? [], `${d.name} received`, actor);
        });

        toast.success(upload ? "Document uploaded" : "Document marked received", doc.name);
        announceAutomation(ticked);
      },

      sendEmail: (fileId, templateId, actor = "Demo Agent") => {
        const file = get().files.find((f) => f.id === fileId);
        const template = EMAIL_TEMPLATES.find((t) => t.id === templateId);
        if (!file || !template) return;
        let emailTicked: string[] = [];

        set((s) => {
          const f = s.files.find((x) => x.id === fileId);
          if (!f) return;
          f.sentEmails.unshift({
            id: uuid(),
            templateId,
            subject: interpolateTemplate(template.subject, f),
            sentAt: new Date().toISOString(),
            sentBy: actor,
          });
          f.activity.unshift({
            id: uuid(),
            type: "message_sent",
            description: `Email sent: ${template.name}`,
            actor,
            createdAt: new Date().toISOString(),
          });
          f.updatedAt = new Date().toISOString();
          emailTicked = runAutomation(f, ON_EMAIL_SENT[templateId] ?? [], `${template.name} sent`, actor);
          if (templateId === "portal_invite" && f.portalAccess) f.portalAccess.invitedAt = new Date().toISOString();
        });

        toast.info("Email sent", `${template.name} sent to ${file.clientName}`);
        announceAutomation(emailTicked);
      },

      sendMessage: (fileId, content, sender) => {
        set((s) => {
          const file = s.files.find((f) => f.id === fileId);
          if (!file) return;
          const msg: Message = {
            id: uuid(),
            sender,
            content,
            sentAt: new Date().toISOString(),
          };
          file.messages.push(msg);
          file.activity.unshift({
            id: uuid(),
            type: "message_sent",
            description: `${sender === "agent" ? "Agent" : "Client"} message sent`,
            actor: sender === "agent" ? "Demo Agent" : file.clientName,
            createdAt: new Date().toISOString(),
          });
          file.updatedAt = new Date().toISOString();
          broadcast(s, {
            fileId,
            title: sender === "agent" ? "New message from your agent" : "New message from your client",
            message: content.length > 90 ? `${content.slice(0, 90)}\u2026` : content,
            tone: "info",
          });
        });
      },

      addNote: (fileId, content, author) => {
        set((s) => {
          const file = s.files.find((f) => f.id === fileId);
          if (!file) return;
          const note: Note = {
            id: uuid(),
            content,
            author,
            createdAt: new Date().toISOString(),
          };
          file.notes.unshift(note);
          file.activity.unshift({
            id: uuid(),
            type: "note_added",
            description: `Note added`,
            actor: author,
            createdAt: new Date().toISOString(),
          });
          file.updatedAt = new Date().toISOString();
        });
      },

      updateFinancials: (fileId, updates) => {
        let ticked: string[] = [];
        set((s) => {
          const file = s.files.find((f) => f.id === fileId);
          if (!file) return;
          const earnestNowReceived =
            updates.earnestMoneyStatus === "received" && file.financials.earnestMoneyStatus !== "received";
          Object.assign(file.financials, updates);
          if (updates.listPrice) file.listPrice = updates.listPrice;
          file.updatedAt = new Date().toISOString();
          if (earnestNowReceived) {
            pushWorkActivity(file, "status_change", "Earnest money marked received", "Demo Agent");
            ticked = runAutomation(file, ON_EARNEST_RECEIVED, "earnest money received", "Demo Agent");
          }
        });
        announceAutomation(ticked);
      },

      addOffer: (fileId, offer) => {
        const file = get().files.find((f) => f.id === fileId);
        if (!file) return;
        const isFirst = file.offers.length === 0;
        let offerTicked: string[] = [];

        set((s) => {
          const f = s.files.find((x) => x.id === fileId);
          if (!f) return;
          f.offers.unshift({
            ...offer,
            id: uuid(),
            status: "pending",
            receivedAt: new Date().toISOString(),
          });
          offerTicked = runAutomation(f, ON_OFFER_LOGGED, "offer logged", "Demo Agent");
          f.activity.unshift({
            id: uuid(),
            type: "status_change",
            description: `Offer logged: $${offer.amount.toLocaleString()} from ${offer.buyerName}`,
            actor: "Demo Agent",
            createdAt: new Date().toISOString(),
          });
          f.updatedAt = new Date().toISOString();
          broadcast(s, {
            fileId,
            title: "An offer came in",
            message: isFirst
              ? "Your agent has received an offer and will be in touch."
              : "Another offer has come in — your agent will walk you through both.",
            tone: "success",
          });
        });

        toast.success(
          isFirst ? "Offer logged" : `Offer ${file.offers.length + 1} logged`,
          `$${offer.amount.toLocaleString()} from ${offer.buyerName}`
        );
        announceAutomation(offerTicked);
      },

      setOfferStatus: (fileId, offerId, status, actor = "Demo Agent") => {
        const file = get().files.find((f) => f.id === fileId);
        const offer = file?.offers.find((o) => o.id === offerId);
        if (!file || !offer) return;
        let movedOnAccept = 0;
        let acceptTicked: string[] = [];

        set((s) => {
          const f = s.files.find((x) => x.id === fileId);
          const o = f?.offers.find((x) => x.id === offerId);
          if (!f || !o) return;

          o.status = status;

          // Accepting one offer necessarily rejects the others, and moves the
          // file under contract at the accepted price.
          if (status === "accepted") {
            f.offers.forEach((other) => {
              if (other.id !== offerId && other.status === "pending") {
                other.status = "rejected";
              }
            });
            f.listPrice = o.amount;
            f.financials.listPrice = o.amount;
            if (o.earnestMoney) f.financials.earnestMoney = o.earnestMoney;
            // Acceptance is the contract date; closing defaults to 30 days out
            // when the offer did not propose one — the usual financed timeline.
            f.contractDate = new Date().toISOString();
            acceptTicked = runAutomation(f, ON_OFFER_ACCEPTED, "offer accepted", actor);
            f.closingDate = o.proposedClosingDate ?? addDays(new Date(), 30).toISOString();
            movedOnAccept = rescheduleChecklist(f.checklist, {
              contractDate: f.contractDate,
              closingDate: f.closingDate,
            });
            if (movedOnAccept > 0) {
              pushWorkActivity(
                f,
                "automation",
                `${movedOnAccept} deadlines set from the contract date and a ${format(new Date(f.closingDate), "MMM d")} closing`,
                "ITERA"
              );
            }
            if (f.status !== "under_contract" && f.status !== "closed") {
              const prevLabel = STATUS_THEME[f.status].label;
              f.status = "under_contract";
              f.activity.unshift({
                id: uuid(),
                type: "status_change",
                description: `Status changed from ${prevLabel} to Under Contract`,
                actor,
                createdAt: new Date().toISOString(),
              });
            }
          }

          f.activity.unshift({
            id: uuid(),
            type: "status_change",
            description: `Offer from ${o.buyerName} marked ${status}`,
            actor,
            createdAt: new Date().toISOString(),
          });
          f.updatedAt = new Date().toISOString();

          if (status === "accepted") {
            broadcast(s, {
              fileId,
              title: "Your offer was accepted",
              message: `${f.propertyAddress} is under contract at $${o.amount.toLocaleString()}.`,
              tone: "success",
            });
          }
        });

        if (status === "accepted") {
          toast.success(
            "Offer accepted",
            `$${offer.amount.toLocaleString()} — file moved to Under Contract`
          );
          announceAutomation(acceptTicked);
          if (movedOnAccept > 0) {
            setTimeout(
              () => toast.info("Deadlines recalculated", `${movedOnAccept} contract deadlines now follow the closing date`),
              700
            );
          }
        } else {
          toast.info(`Offer ${status}`, `${offer.buyerName} — $${offer.amount.toLocaleString()}`);
        }
      },

      uploadDocument: (fileId, docId, upload) => {
        get().markDocumentReceived(fileId, docId, "Demo Agent", upload);
      },

      addUploadedDocument: (fileId, name, category, upload) => {
        set((s) => {
          const f = s.files.find((x) => x.id === fileId);
          if (!f) return;
          const ext = upload.originalName.includes(".") ? upload.originalName.split(".").pop() : "pdf";
          f.documents.push({
            id: uuid(),
            name,
            fileName: buildDocumentFileName(fileNameBase(f), name).replace(/\.pdf$/, `.${ext}`),
            category,
            status: "received",
            receivedAt: new Date().toISOString(),
            receivedBy: "Demo Agent",
            ...upload,
          });
          pushWorkActivity(f, "document_received", `Document uploaded: ${name}`, "Demo Agent");
        });
        toast.success("Document uploaded", name);
      },

      setKeyDates: (fileId, dates) => {
        let moved = 0;
        set((s) => {
          const f = s.files.find((x) => x.id === fileId);
          if (!f) return;
          if (dates.contractDate !== undefined) f.contractDate = dates.contractDate || undefined;
          if (dates.closingDate !== undefined) f.closingDate = dates.closingDate || undefined;
          moved = rescheduleChecklist(f.checklist, {
            contractDate: f.contractDate,
            closingDate: f.closingDate,
          });
          const parts: string[] = [];
          if (dates.closingDate) parts.push(`closing set to ${format(new Date(dates.closingDate), "MMM d, yyyy")}`);
          if (dates.contractDate) parts.push(`contract date set to ${format(new Date(dates.contractDate), "MMM d, yyyy")}`);
          pushWorkActivity(
            f,
            "milestone_updated",
            `Key dates updated: ${parts.join(", ")}${moved ? ` — ${moved} deadlines moved` : ""}`,
            "Demo Agent"
          );
          if (dates.closingDate) {
            broadcast(s, {
              fileId,
              title: "Closing date confirmed",
              message: `Closing is scheduled for ${format(new Date(dates.closingDate), "EEEE, MMMM d")}.`,
              tone: "success",
            });
          }
        });
        toast.success(
          "Dates saved",
          moved > 0 ? `${moved} deadline${moved === 1 ? "" : "s"} recalculated to match` : "No deadlines needed to move"
        );
      },

      addPhotos: (fileId, photos) => {
        if (photos.length === 0) return;
        let ticked: string[] = [];
        set((s) => {
          const f = s.files.find((x) => x.id === fileId);
          if (!f) return;
          f.photos = [...(f.photos ?? []), ...photos];
          if (!f.coverPhotoId) f.coverPhotoId = photos[0].id;
          pushWorkActivity(
            f,
            "photo_added",
            `${photos.length} photo${photos.length === 1 ? "" : "s"} uploaded`,
            "Demo Agent"
          );
          ticked = runAutomation(f, ON_PHOTOS_ADDED, "photos uploaded", "Demo Agent");
        });
        toast.success(
          `${photos.length} photo${photos.length === 1 ? "" : "s"} uploaded`,
          "Saved to this file"
        );
        announceAutomation(ticked);
      },

      removePhoto: (fileId, photoId) => {
        set((s) => {
          const f = s.files.find((x) => x.id === fileId);
          if (!f) return;
          f.photos = (f.photos ?? []).filter((p) => p.id !== photoId);
          if (f.coverPhotoId === photoId) f.coverPhotoId = f.photos[0]?.id;
          f.updatedAt = new Date().toISOString();
        });
      },

      setCoverPhoto: (fileId, photoId) => {
        set((s) => {
          const f = s.files.find((x) => x.id === fileId);
          if (!f) return;
          f.coverPhotoId = photoId;
          f.updatedAt = new Date().toISOString();
        });
        toast.success("Cover photo set", "Shown on the dashboard card");
      },

      updatePhotoCaption: (fileId, photoId, caption) => {
        set((s) => {
          const p = s.files.find((x) => x.id === fileId)?.photos?.find((x) => x.id === photoId);
          if (p) p.caption = caption;
        });
      },

      addCustomField: (fileId, field) => {
        set((s) => {
          const f = s.files.find((x) => x.id === fileId);
          if (!f) return;
          f.customFields = [
            ...(f.customFields ?? []),
            { ...field, id: uuid(), createdAt: new Date().toISOString() },
          ];
          pushWorkActivity(f, "field_changed", `Detail added: ${field.label}`, "Demo Agent");
        });
        toast.success("Detail added", field.label);
      },

      updateCustomField: (fileId, fieldId, updates) => {
        set((s) => {
          const f = s.files.find((x) => x.id === fileId);
          const field = f?.customFields?.find((x) => x.id === fieldId);
          if (!f || !field) return;
          Object.assign(field, updates);
          if (updates.value !== undefined || updates.label !== undefined) {
            pushWorkActivity(f, "field_changed", `Detail updated: ${field.label}`, "Demo Agent");
          }
        });
      },

      removeCustomField: (fileId, fieldId) => {
        set((s) => {
          const f = s.files.find((x) => x.id === fileId);
          if (!f) return;
          const field = f.customFields?.find((x) => x.id === fieldId);
          f.customFields = (f.customFields ?? []).filter((x) => x.id !== fieldId);
          if (field) pushWorkActivity(f, "field_changed", `Detail removed: ${field.label}`, "Demo Agent");
        });
      },

      addReminder: (fileId, reminder) => {
        set((s) => {
          const f = s.files.find((x) => x.id === fileId);
          if (!f) return;
          f.reminders = [
            ...(f.reminders ?? []),
            { ...reminder, id: uuid(), done: false, createdAt: new Date().toISOString() },
          ];
          pushWorkActivity(
            f,
            "reminder",
            `Reminder set for ${format(new Date(reminder.dueAt), "MMM d 'at' h:mm a")}: ${reminder.title}`,
            "Demo Agent"
          );
        });
        toast.success("Reminder set", `${format(new Date(reminder.dueAt), "EEE, MMM d 'at' h:mm a")}`);
      },

      toggleReminder: (fileId, reminderId) => {
        set((s) => {
          const r = s.files.find((x) => x.id === fileId)?.reminders?.find((x) => x.id === reminderId);
          if (r) r.done = !r.done;
        });
      },

      removeReminder: (fileId, reminderId) => {
        set((s) => {
          const f = s.files.find((x) => x.id === fileId);
          if (f) f.reminders = (f.reminders ?? []).filter((r) => r.id !== reminderId);
        });
      },

      markReminderFired: (fileId, reminderId) => {
        set((s) => {
          const r = s.files.find((x) => x.id === fileId)?.reminders?.find((x) => x.id === reminderId);
          if (r && !r.firedAt) r.firedAt = new Date().toISOString();
        });
      },

      /**
       * Changing an answer that shaped the checklist reshapes it: flag a file
       * as a referral later and the referral agreement task and document appear
       * (marked with why); un-flag it and they go — unless work on them has
       * already started, in which case they stay rather than lose that work.
       */
      updateIntakeFlags: (fileId, flags) => {
        let added: string[] = [];
        let removed: string[] = [];
        set((s) => {
          const f = s.files.find((x) => x.id === fileId);
          if (!f) return;
          Object.assign(f, flags);
          if (flags.referralPercentage !== undefined) f.financials.referralPercentage = flags.referralPercentage;

          const answers: IntakeAnswers = {
            clientName: f.clientName,
            phone: f.phone,
            email: f.email,
            side: f.side,
            propertyAddress: f.propertyAddress,
            isReferral: f.isReferral,
            isRelocation: f.isRelocation,
            builtBefore1978: f.side === "listing" ? f.builtBefore1978 : undefined,
          };
          const target = generateChecklist(answers);
          const targetIds = new Set(target.map((t) => t.id));
          const existingIds = new Set(f.checklist.map((t) => t.id));

          const kept = f.checklist.filter((t) => {
            if (targetIds.has(t.id)) return true;
            const started = t.status === "completed" || t.subtasks.some((st) => st.completed);
            if (!started) removed.push(t.title);
            return started;
          });
          const fresh = target.filter((t) => !existingIds.has(t.id));
          added = fresh.map((t) => t.title);

          // Rebuild in template order so new tasks land in the right phase.
          const byId = new Map([...kept, ...fresh].map((t) => [t.id, t]));
          const ordered = target.map((t) => byId.get(t.id)!).filter(Boolean);
          const orphans = kept.filter((t) => !targetIds.has(t.id));
          f.checklist = [...ordered, ...orphans].map((t) => ({
            ...t,
            dependsOn: target.find((x) => x.id === t.id)?.dependsOn ?? t.dependsOn,
          }));
          recalculateChecklist(f);

          // Documents follow the same rule by name.
          const targetDocs = generateDocuments(answers);
          const docNames = new Set(f.documents.map((d) => d.name));
          const targetNames = new Set(targetDocs.map((d) => d.name));
          f.documents = [
            ...f.documents.filter((d) => targetNames.has(d.name) || d.status === "received"),
            ...targetDocs.filter((d) => !docNames.has(d.name)),
          ];

          if (added.length || removed.length) {
            pushWorkActivity(
              f,
              "automation",
              `Checklist reshaped after intake change${added.length ? ` — added ${added.join(", ")}` : ""}${
                removed.length ? ` — removed ${removed.join(", ")}` : ""
              }`,
              "ITERA"
            );
          } else {
            pushWorkActivity(f, "profile_updated", "Intake answers updated", "Demo Agent");
          }
        });

        if (added.length) toast.success("Checklist updated", `Added: ${added.join(", ")}`);
        else if (removed.length) toast.info("Checklist updated", `Removed: ${removed.join(", ")}`);
        else toast.success("Saved", "Intake answers updated");
      },

      resetPortalPassword: (fileId) => {
        let pw = "";
        set((s) => {
          const f = s.files.find((x) => x.id === fileId);
          if (!f) return;
          if (!f.portalAccess) f.portalAccess = createPortalAccess(f.email);
          if (!f.portalAccess) return;
          pw = makeTempPassword();
          f.portalAccess.password = pw;
          pushWorkActivity(f, "profile_updated", "Client portal password reset", "Demo Agent");
        });
        if (pw) toast.success("New password created", `The old one no longer works. New password: ${pw}`);
      },

      setPortalEnabled: (fileId, enabled) => {
        set((s) => {
          const f = s.files.find((x) => x.id === fileId);
          if (!f) return;
          if (!f.portalAccess) f.portalAccess = createPortalAccess(f.email);
          if (!f.portalAccess) return;
          f.portalAccess.enabled = enabled;
          pushWorkActivity(f, "profile_updated", `Client portal access ${enabled ? "turned on" : "turned off"}`, "Demo Agent");
        });
        toast.info(enabled ? "Portal access on" : "Portal access off", enabled ? "The client can sign in" : "The client can no longer sign in");
      },

      setPortalVisibility: (fileId, updates) => {
        set((s) => {
          const f = s.files.find((x) => x.id === fileId);
          if (!f?.portalAccess) return;
          Object.assign(f.portalAccess.visibility, updates);
          f.updatedAt = new Date().toISOString();
        });
      },

      recordClientSignIn: (fileId) => {
        set((s) => {
          const f = s.files.find((x) => x.id === fileId);
          if (!f?.portalAccess) return;
          f.portalAccess.lastSignInAt = new Date().toISOString();
        });
      },

      importFiles: (rows) => {
        const ids: string[] = [];
        set((s) => {
          rows.forEach((row) => {
            const file = createTransactionFromIntake(row.answers);
            if (row.status) {
              file.status = row.status;
              advanceChecklistToStatus(file.checklist, row.status, new Date().toISOString());
              recalculateChecklist(file);
            }
            if (row.listPrice) {
              file.listPrice = row.listPrice;
              file.financials.listPrice = row.listPrice;
            }
            if (row.commissionRate) file.financials.commissionRate = row.commissionRate;
            if (row.closingDate) {
              file.closingDate = row.closingDate;
              rescheduleChecklist(file.checklist, { closingDate: row.closingDate });
            }
            if (row.note) {
              file.notes.unshift({
                id: uuid(),
                content: row.note,
                author: "Spreadsheet import",
                createdAt: new Date().toISOString(),
              });
            }
            file.customFields = row.customFields.map((cf) => ({
              id: uuid(),
              label: cf.label,
              value: cf.value,
              type: "text" as const,
              pinned: false,
              source: "import" as const,
              createdAt: new Date().toISOString(),
            }));
            file.activity = [
              {
                id: uuid(),
                type: "status_change",
                description: `Imported from spreadsheet — checklist built with ${file.checklist.length} tasks`,
                actor: "Demo Agent",
                createdAt: new Date().toISOString(),
              },
            ];
            s.files.unshift(file);
            ids.push(file.id);
          });
        });
        return ids;
      },

      addDocument: (fileId, name, category) => {
        const file = get().files.find((f) => f.id === fileId);
        if (!file) return;
        set((s) => {
          const f = s.files.find((x) => x.id === fileId);
          if (!f) return;
          f.documents.push({
            id: uuid(),
            name,
            fileName: buildDocumentFileName(fileNameBase(f), name),
            category,
            status: "needed",
          });
          f.updatedAt = new Date().toISOString();
        });
        toast.info("Document added", `${name} added to the expected list`);
      },

      /**
       * Turns a quick lead into a full file: regenerates the checklist and
       * documents from the completed answers while keeping the file's id,
       * notes, and activity history intact.
       */
      completeIntake: (fileId, answers) => {
        const existing = get().files.find((f) => f.id === fileId);
        if (!existing) return;

        const rebuilt = createTransactionFromIntake(answers, {
          id: existing.id,
          status: existing.status,
          createdAt: existing.createdAt,
          notes: existing.notes,
          messages: existing.messages,
          sentEmails: existing.sentEmails,
          offers: existing.offers,
          listPrice: existing.listPrice,
          isQuickLead: false,
          clientProfile: existing.clientProfile,
          cma: existing.cma,
          listingDetails: existing.listingDetails,
          propertyPrep: existing.propertyPrep,
          media: existing.media,
          showings: existing.showings,
          marketing: existing.marketing,
          buyerSearch: existing.buyerSearch,
        });

        set((s) => {
          const idx = s.files.findIndex((f) => f.id === fileId);
          if (idx === -1) return;
          rebuilt.activity = [
            {
              id: uuid(),
              type: "status_change",
              description: `Intake completed — checklist rebuilt with ${rebuilt.checklist.length} tasks`,
              actor: "Demo Agent",
              createdAt: new Date().toISOString(),
            },
            ...existing.activity,
          ];
          rebuilt.financials = { ...existing.financials, referralPercentage: answers.referralPercentage };
          s.files[idx] = rebuilt;
        });

        toast.success(
          "Intake completed",
          `Checklist rebuilt with ${rebuilt.checklist.length} tasks for ${answers.clientName}`
        );
      },

      updateClientProfile: (fileId, updates, actor = "Demo Agent") => {
        set((s) => {
          const f = s.files.find((x) => x.id === fileId);
          if (!f) return;
          Object.assign(f.clientProfile, updates, { updatedAt: new Date().toISOString() });
          if (updates.preferredContact !== undefined) f.preferredContact = updates.preferredContact;
          if (updates.preferredContactTime !== undefined) {
            f.preferredContactTime = updates.preferredContactTime;
          }
          pushWorkActivity(f, "profile_updated", "Client profile updated", actor);
        });
        toast.success("Profile saved", "Client details are on the file");
      },

      updateCma: (fileId, updates, actor = "Demo Agent") => {
        set((s) => {
          const f = s.files.find((x) => x.id === fileId);
          if (!f) return;
          Object.assign(f.cma, updates, { updatedAt: new Date().toISOString() });
          if (updates.recommendedPrice && updates.recommendedPrice > 0 && !f.listPrice) {
            f.listPrice = updates.recommendedPrice;
            f.financials.listPrice = updates.recommendedPrice;
          }
          pushWorkActivity(f, "cma_updated", "CMA / pricing updated", actor);
        });
        toast.success("CMA saved", "Pricing work is on the file");
      },

      updateListingDetails: (fileId, updates, actor = "Demo Agent") => {
        set((s) => {
          const f = s.files.find((x) => x.id === fileId);
          if (!f) return;
          Object.assign(f.listingDetails, updates, { updatedAt: new Date().toISOString() });
          if (updates.publishStatus === "published_external" && !f.listingDetails.publishedAt) {
            f.listingDetails.publishedAt = new Date().toISOString();
          }
          const desc =
            updates.publishStatus === "published_external"
              ? "Listing sheet marked published externally"
              : "Listing details updated";
          pushWorkActivity(f, "listing_updated", desc, actor);
        });
        toast.success("Listing saved", "Property details are on the file");
      },

      updatePropertyPrep: (fileId, updates, actor = "Demo Agent") => {
        set((s) => {
          const f = s.files.find((x) => x.id === fileId);
          if (!f) return;
          Object.assign(f.propertyPrep, updates, { updatedAt: new Date().toISOString() });
          pushWorkActivity(f, "prep_updated", "Property prep updated", actor);
        });
        toast.success("Prep saved", "Repair and staging plan updated");
      },

      updateMedia: (fileId, updates, actor = "Demo Agent") => {
        set((s) => {
          const f = s.files.find((x) => x.id === fileId);
          if (!f) return;
          Object.assign(f.media, updates, { updatedAt: new Date().toISOString() });
          pushWorkActivity(f, "media_updated", "Photo / media plan updated", actor);
        });
        toast.success("Media saved", "Photography plan updated");
      },

      updateShowings: (fileId, updates, actor = "Demo Agent") => {
        set((s) => {
          const f = s.files.find((x) => x.id === fileId);
          if (!f) return;
          const prevCount = f.showings.appointments.length;
          Object.assign(f.showings, updates, { updatedAt: new Date().toISOString() });
          const logged = (updates.appointments?.length ?? prevCount) > prevCount;
          pushWorkActivity(
            f,
            "showing_logged",
            logged ? "Showing logged" : "Showing instructions updated",
            actor
          );
        });
        toast.success("Showings saved", "Access and feedback are on the file");
      },

      updateMarketing: (fileId, updates, actor = "Demo Agent") => {
        set((s) => {
          const f = s.files.find((x) => x.id === fileId);
          if (!f) return;
          Object.assign(f.marketing, updates, { updatedAt: new Date().toISOString() });
          pushWorkActivity(f, "marketing_updated", "Marketing campaign updated", actor);
        });
        toast.success("Marketing saved", "Campaign activity recorded");
      },

      updateBuyerSearch: (fileId, updates, actor = "Demo Agent") => {
        set((s) => {
          const f = s.files.find((x) => x.id === fileId);
          if (!f) return;
          Object.assign(f.buyerSearch, updates, { updatedAt: new Date().toISOString() });
          pushWorkActivity(f, "marketing_updated", "Buyer search criteria updated", actor);
        });
        toast.success("Search saved", "Buyer criteria are on the file");
      },

      updateMilestone: (fileId, milestoneId, updates, actor = "Demo Agent") => {
        set((s) => {
          const f = s.files.find((x) => x.id === fileId);
          if (!f) return;
          const m = f.milestones.find((x) => x.id === milestoneId);
          if (!m) return;
          Object.assign(m, updates);
          if (updates.status === "complete" && !m.completedAt) {
            m.completedAt = new Date().toISOString();
          }
          pushWorkActivity(f, "milestone_updated", `Milestone updated: ${m.title}`, actor);
        });
        toast.success("Milestone updated", "Transaction progress recorded");
      },

      updateAgreement: (fileId, agreementId, updates, actor = "Demo Agent") => {
        set((s) => {
          const f = s.files.find((x) => x.id === fileId);
          if (!f) return;
          const a = f.agreements.find((x) => x.id === agreementId);
          if (!a) return;
          Object.assign(a, updates);
          if (updates.status === "executed" && !a.executedAt) {
            a.executedAt = new Date().toISOString();
          }
          if (a.kind === "listing" && updates.listPrice) {
            f.listPrice = updates.listPrice;
            f.financials.listPrice = updates.listPrice;
          }
          if (updates.commissionRate !== undefined) {
            f.financials.commissionRate = updates.commissionRate;
          }
          pushWorkActivity(f, "agreement_updated", `Agreement updated: ${a.kind}`, actor);
        });
        toast.success("Agreement saved", "Terms logged on the file");
      },
    })),
    {
      name: "itera-transactions-v3",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        files: state.files,
        initialized: state.initialized,
        lastEvent: state.lastEvent,
      }),
      /**
       * Seeding deliberately does NOT happen here. Mutating the rehydrated
       * draft inside onRehydrateStorage bypasses `set`, so persist never writes
       * the result back — the store would look seeded in memory while
       * localStorage stayed empty, and the cross-tab sync that the client view
       * depends on would never fire. `initialize()` seeds through `set`
       * instead, which does persist.
       */
    }
  )
);
