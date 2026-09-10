import { addDays, subDays, subHours } from "date-fns";
import { v4 as uuid } from "uuid";
import {
  createTransactionFromIntake,
  generateChecklist,
  resolveTaskStatus,
} from "@/lib/checklist/engine";
import { ensureWorkFields } from "@/lib/work/defaults";
import {
  enrichMapleCourt,
  enrichMarcusBuyer,
  enrichOakwood,
  enrichShoalCreek,
} from "@/lib/seed/work-enrichment";
import type {
  IntakeAnswers,
  Message,
  Note,
  Offer,
  TransactionFile,
  TransactionStatus,
} from "@/types";

const AGENT = "Demo Agent";

interface SeedOptions {
  status: TransactionStatus;
  listPrice: number;
  /** How many checklist tasks are already done, counted from the top. */
  completedTasks: number;
  /** Marks the next task after those as partially worked. */
  inProgressNext?: boolean;
  /** How many documents are already received, counted from the top. */
  receivedDocs?: number;
  closingDate?: string;
  commissionRate?: number;
  earnestMoney?: number;
  earnestReceived?: boolean;
  offers?: Offer[];
  notes?: { body: string; daysAgo: number; author?: string }[];
  messages?: { from: "agent" | "client"; body: string; hoursAgo: number }[];
  emails?: { templateId: string; subject: string; daysAgo: number }[];
  /** Days ago the file was opened — drives the checklist's due dates. */
  openedDaysAgo?: number;
  /**
   * When the next outstanding task falls due, relative to today. Negative
   * values deliberately place a task in the past so the overdue state has
   * something real to point at. Remaining tasks step out from there.
   */
  firstDueInDays?: number;
  dueStepDays?: number;
  /** Optional work-record enrichment after defaults are applied. */
  enrichWork?: (file: TransactionFile) => void;
}

function seedFile(answers: IntakeAnswers, opts: SeedOptions): TransactionFile {
  const openedDaysAgo = opts.openedDaysAgo ?? 30;
  const startDate = subDays(new Date(), openedDaysAgo);

  let file = createTransactionFromIntake(answers);
  file = ensureWorkFields(file);
  file.status = opts.status;
  file.createdAt = startDate.toISOString();
  file.listPrice = opts.listPrice;
  file.closingDate = opts.closingDate;
  file.financials = {
    listPrice: opts.listPrice,
    commissionRate: opts.commissionRate ?? 0.03,
    earnestMoney: opts.earnestMoney ?? 0,
    earnestMoneyStatus: opts.earnestReceived ? "received" : "pending",
    referralPercentage: answers.referralPercentage,
  };
  file.offers = opts.offers ?? [];
  // Files past acceptance carry the contract date the deadlines hang off.
  const accepted = file.offers.find((o) => o.status === "accepted");
  if (accepted) file.contractDate = accepted.receivedAt;

  /* ── Checklist: walk it forward to the requested point ── */
  const checklist = generateChecklist(answers, startDate);
  const done = Math.min(opts.completedTasks, checklist.length);

  file.checklist = checklist.map((task, i) => {
    if (i < done) {
      const completedAt = subDays(new Date(), Math.max(1, openedDaysAgo - i * 2));
      return {
        ...task,
        status: "completed" as const,
        completedAt: completedAt.toISOString(),
        completedBy: AGENT,
        subtasks: task.subtasks.map((st) => ({ ...st, completed: true })),
      };
    }

    if (i === done && opts.inProgressNext) {
      return {
        ...task,
        status: "in_progress" as const,
        subtasks: task.subtasks.map((st, si) => ({ ...st, completed: si === 0 })),
      };
    }

    return task;
  });

  /* ── Re-base outstanding due dates onto today ──
     The templates count days from the file's start, which for an older file
     would put every remaining deadline in the past. Anchoring the outstanding
     work to today instead keeps the demo showing a live, plausible spread. */
  if (opts.status !== "closed" && opts.status !== "dropped" && opts.status !== "terminated") {
    const firstDue = opts.firstDueInDays ?? 4;
    const step = opts.dueStepDays ?? 6;
    let position = 0;
    file.checklist = file.checklist.map((task) => {
      if (task.status === "completed" || !task.dueDate) return task;
      const due = addDays(new Date(), firstDue + position * step);
      position += 1;
      return { ...task, dueDate: due.toISOString() };
    });
  }

  /* ── Resolve dependency locks ──
     resolveTaskStatus is what marks a task "blocked" when something it depends
     on is still open. The store runs it on every toggle, but seeded files have
     never been toggled — so run it once here, or the enforced task ordering
     would be invisible until the first click. */
  file.checklist = file.checklist.map((task) => ({
    ...task,
    status: resolveTaskStatus(task, file.checklist),
  }));

  /* ── Documents: mark the leading ones received ── */
  const receivedDocs = opts.receivedDocs ?? 0;
  file.documents = file.documents.map((doc, i) =>
    i < receivedDocs
      ? {
          ...doc,
          status: "received" as const,
          receivedAt: subDays(new Date(), Math.max(1, openedDaysAgo - i * 3)).toISOString(),
          receivedBy: AGENT,
          sizeKb: 180 + ((i * 137) % 900),
        }
      : doc
  );

  /* ── Notes, messages, sent email history ── */
  file.notes = (opts.notes ?? []).map<Note>((n) => ({
    id: uuid(),
    content: n.body,
    author: n.author ?? AGENT,
    createdAt: subDays(new Date(), n.daysAgo).toISOString(),
  }));

  file.messages = (opts.messages ?? []).map<Message>((m) => ({
    id: uuid(),
    sender: m.from,
    content: m.body,
    sentAt: subHours(new Date(), m.hoursAgo).toISOString(),
  }));

  file.sentEmails = (opts.emails ?? []).map((e) => ({
    id: uuid(),
    templateId: e.templateId,
    subject: e.subject,
    sentAt: subDays(new Date(), e.daysAgo).toISOString(),
    sentBy: AGENT,
  }));

  file.clientProfile = {
    ...file.clientProfile,
    preferredContact: answers.preferredContact ?? "",
    preferredContactTime: answers.preferredContactTime ?? "",
  };

  opts.enrichWork?.(file);

  /* ── Activity log, reconstructed from everything above ── */
  const activity = [
    ...file.checklist
      .filter((t) => t.status === "completed")
      .map((t) => ({
        id: uuid(),
        type: "task_completed" as const,
        description: `Completed: ${t.title}`,
        actor: AGENT,
        createdAt: t.completedAt!,
      })),
    ...file.documents
      .filter((d) => d.status === "received")
      .map((d) => ({
        id: uuid(),
        type: "document_received" as const,
        description: `Document received: ${d.name}`,
        actor: AGENT,
        createdAt: d.receivedAt!,
      })),
    ...file.notes.map((n) => ({
      id: uuid(),
      type: "note_added" as const,
      // Carry an excerpt so the portfolio feed says something useful.
      description: `Note: ${n.content.length > 64 ? `${n.content.slice(0, 64)}\u2026` : n.content}`,
      actor: n.author,
      createdAt: n.createdAt,
    })),
    ...file.sentEmails.map((e) => ({
      id: uuid(),
      type: "message_sent" as const,
      description: `Email sent: ${e.subject}`,
      actor: AGENT,
      createdAt: e.sentAt,
    })),
    ...file.messages.map((m) => ({
      id: uuid(),
      type: "message_sent" as const,
      description:
        m.sender === "agent"
          ? "Replied to the client"
          : `${answers.clientName} sent a message`,
      actor: m.sender === "agent" ? AGENT : answers.clientName,
      createdAt: m.sentAt,
    })),
    ...file.offers.map((o) => ({
      id: uuid(),
      type: "status_change" as const,
      description:
        o.status === "accepted"
          ? `Offer accepted: $${o.amount.toLocaleString()} from ${o.buyerName}`
          : `Offer logged: $${o.amount.toLocaleString()} from ${o.buyerName}`,
      actor: AGENT,
      createdAt: o.receivedAt,
    })),
    ...(file.cma.comps.length
      ? [
          {
            id: uuid(),
            type: "cma_updated" as const,
            description: `CMA presented at $${file.cma.recommendedPrice.toLocaleString()}`,
            actor: AGENT,
            createdAt: file.cma.presentedAt ?? subDays(new Date(), openedDaysAgo - 4).toISOString(),
          },
        ]
      : []),
    ...(file.showings.appointments.length
      ? file.showings.appointments.slice(0, 3).map((a) => ({
          id: uuid(),
          type: "showing_logged" as const,
          description: `Showing with ${a.agentOrBuyer}`,
          actor: AGENT,
          createdAt: a.scheduledAt,
        }))
      : []),
    ...(file.listingDetails.publishStatus !== "draft"
      ? [
          {
            id: uuid(),
            type: "listing_updated" as const,
            description:
              file.listingDetails.publishStatus === "published_external"
                ? "Listing sheet marked published externally"
                : "Listing sheet marked ready",
            actor: AGENT,
            createdAt:
              file.listingDetails.publishedAt ??
              subDays(new Date(), Math.max(1, openedDaysAgo - 12)).toISOString(),
          },
        ]
      : []),
    {
      id: uuid(),
      type: "status_change" as const,
      description: "File created",
      actor: AGENT,
      createdAt: startDate.toISOString(),
    },
  ];

  file.activity = activity.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  file.updatedAt = file.activity[0]?.createdAt ?? file.createdAt;

  return file;
}

function offer(
  buyerName: string,
  amount: number,
  daysAgo: number,
  status: Offer["status"],
  extra: Partial<Offer> = {}
): Offer {
  return {
    id: uuid(),
    buyerName,
    amount,
    financing: "conventional",
    receivedAt: subDays(new Date(), daysAgo).toISOString(),
    status,
    ...extra,
  };
}

export const SEED_TRANSACTIONS: TransactionFile[] = [
  /* ── Under contract, two offers on the table, pre-1978 property ──
     This is the file to open in a demo: it has the most going on. */
  seedFile(
    {
      clientName: "James & Linda Chen",
      phone: "(555) 345-6789",
      email: "chen.family@email.com",
      side: "listing",
      propertyAddress: "729 Maple Court, Round Rock, TX 78664",
      isReferral: false,
      isRelocation: false,
      builtBefore1978: true,
      leadSource: "Past Client",
      coClientName: "Linda Chen",
      preferredContact: "Email",
      preferredContactTime: "Weekday mornings",
    },
    {
      status: "under_contract",
      listPrice: 489000,
      openedDaysAgo: 52,
      completedTasks: 17,
      inProgressNext: true,
      receivedDocs: 7,
      firstDueInDays: 3,
      dueStepDays: 5,
      closingDate: addDays(new Date(), 18).toISOString(),
      commissionRate: 0.025,
      earnestMoney: 7500,
      earnestReceived: true,
      offers: [
        offer("Rivera Household", 489000, 10, "accepted", {
          earnestMoney: 7500,
          financing: "conventional",
          contingencies: "Inspection, Financing, Appraisal",
          proposedClosingDate: addDays(new Date(), 18).toISOString(),
          notes: "Strong lender letter, flexible on possession date.",
        }),
        offer("T. Whitfield (buyer agent: Nova RE)", 475000, 14, "rejected", {
          earnestMoney: 5000,
          financing: "fha",
          contingencies: "Inspection, Financing, Appraisal, Sale of home",
          notes: "Contingent on the sale of their current home.",
        }),
      ],
      notes: [
        {
          body: "Inspection turned up a failing water heater and two GFCI outlets. Sellers agreed to a $2,400 credit rather than doing the work themselves — amendment signed.",
          daysAgo: 6,
        },
        {
          body: "Linda travels for work through the 22nd. Route anything time-sensitive through James in the meantime.",
          daysAgo: 12,
        },
        {
          body: "House was built in 1961, so the lead-based paint disclosure is on the file. EPA pamphlet attached to the packet.",
          daysAgo: 40,
        },
      ],
      messages: [
        { from: "client", body: "Morning — did the appraisal come back yet?", hoursAgo: 20 },
        {
          from: "agent",
          body: "It did, came in right at contract price. Nothing for you to do. I'll send the walkthrough time once title confirms.",
          hoursAgo: 18,
        },
        { from: "client", body: "Perfect, thank you.", hoursAgo: 17 },
      ],
      emails: [
        { templateId: "under_contract", subject: "We're under contract on 729 Maple Court", daysAgo: 10 },
        { templateId: "inspection_notice", subject: "Scheduling the inspection for 729 Maple Court", daysAgo: 8 },
        { templateId: "welcome", subject: "Welcome — let's get started on 729 Maple Court", daysAgo: 51 },
      ],
      enrichWork: enrichMapleCourt,
    }
  ),

  /* ── Actively listed, showings under way ── */
  seedFile(
    {
      clientName: "Sarah Mitchell",
      phone: "(555) 234-5678",
      email: "sarah.mitchell@email.com",
      side: "listing",
      propertyAddress: "1842 Oakwood Drive, Austin, TX 78704",
      isReferral: false,
      isRelocation: false,
      builtBefore1978: false,
      leadSource: "Open House",
      petNames: "Biscuit",
      preferredContact: "Text",
      preferredContactTime: "Evenings after 6pm",
    },
    {
      status: "listed",
      listPrice: 625000,
      openedDaysAgo: 21,
      completedTasks: 9,
      inProgressNext: true,
      receivedDocs: 4,
      firstDueInDays: 6,
      dueStepDays: 7,
      commissionRate: 0.03,
      notes: [
        {
          body: "Eleven showings in the first weekend, two second showings booked. Holding price through next Tuesday before we discuss any adjustment.",
          daysAgo: 3,
        },
        {
          body: "Biscuit the golden retriever is crated during showings — agents need 2 hours notice, no exceptions.",
          daysAgo: 18,
        },
      ],
      messages: [
        { from: "client", body: "How did the Saturday open house go?", hoursAgo: 30 },
        {
          from: "agent",
          body: "Busy — 14 groups through. Two are writing this week. I'll call you the moment anything lands.",
          hoursAgo: 28,
        },
      ],
      emails: [
        { templateId: "welcome", subject: "Welcome — let's get started on 1842 Oakwood Drive", daysAgo: 20 },
        { templateId: "doc_request", subject: "A few documents needed for 1842 Oakwood Drive", daysAgo: 14 },
      ],
      enrichWork: enrichOakwood,
    }
  ),

  /* ── Buyer file, corporate referral ── */
  seedFile(
    {
      clientName: "Marcus Williams",
      phone: "(555) 456-7890",
      email: "marcus.w@email.com",
      side: "buying",
      propertyAddress: "3BR/2BA in Cedar Park — $400K to $500K",
      isReferral: true,
      isRelocation: false,
      referralSource: "Corporate",
      referralPercentage: 25,
      leadSource: "Realtor.Com",
      preferredContact: "Phone",
    },
    {
      status: "buyer_agency",
      listPrice: 425000,
      openedDaysAgo: 16,
      completedTasks: 5,
      inProgressNext: true,
      receivedDocs: 3,
      firstDueInDays: 9,
      dueStepDays: 8,
      notes: [
        {
          body: "Referred in by Anchor Relocation at a 25% fee — that comes off the top at closing, so the net is lower than it looks on the calculator.",
          daysAgo: 15,
        },
        {
          body: "Pre-approved to $510K but wants to stay under $470K. School district is the hard constraint, not the price.",
          daysAgo: 11,
        },
      ],
      messages: [
        { from: "client", body: "Saw a new one on Brushy Creek pop up — can we see it Thursday?", hoursAgo: 5 },
      ],
      emails: [{ templateId: "welcome", subject: "Welcome — let's get started on your search", daysAgo: 15 }],
      enrichWork: enrichMarcusBuyer,
    }
  ),
  seedFile(
    {
      clientName: "Emily Rodriguez",
      phone: "(555) 567-8901",
      email: "emily.r@email.com",
      side: "buying",
      propertyAddress: "1205 Barton Springs Rd, Austin, TX 78704",
      isReferral: false,
      isRelocation: true,
      leadSource: "Website",
      coClientName: "Dev Rodriguez",
      preferredContact: "Email",
    },
    {
      status: "in_progress",
      listPrice: 550000,
      openedDaysAgo: 28,
      completedTasks: 7,
      inProgressNext: true,
      receivedDocs: 4,
      firstDueInDays: -2,
      dueStepDays: 7,
      notes: [
        {
          body: "Corporate relocation through Meridian — they cover closing costs up to $8K but need the HUD statement within 30 days of closing.",
          daysAgo: 24,
        },
        {
          body: "Start date at the new job is the 3rd, so possession timing matters more to her than price.",
          daysAgo: 20,
        },
      ],
      messages: [
        { from: "agent", body: "Meridian approved the authorization this morning — we're clear to write.", hoursAgo: 48 },
        { from: "client", body: "That's a relief. Let's go after the Barton Springs one.", hoursAgo: 44 },
      ],
      emails: [{ templateId: "welcome", subject: "Welcome — let's get started on your search", daysAgo: 27 }],
    }
  ),

  /* ── Fresh prospective listing, barely started ── */
  seedFile(
    {
      clientName: "Robert & Diane Foster",
      phone: "(555) 678-9012",
      email: "foster.home@email.com",
      side: "listing",
      propertyAddress: "3301 Westlake Hills Dr, Austin, TX 78746",
      isReferral: false,
      isRelocation: false,
      builtBefore1978: false,
      leadSource: "Past Client",
    },
    {
      status: "prospective",
      listPrice: 875000,
      openedDaysAgo: 5,
      completedTasks: 1,
      inProgressNext: true,
      receivedDocs: 0,
      firstDueInDays: 5,
      dueStepDays: 6,
      notes: [
        {
          body: "Listing appointment went well. They want to be on the market before Thanksgiving. Need the CMA back to them by Friday.",
          daysAgo: 4,
        },
      ],
    }
  ),

  /* ── Closed and paid, for the completed-state view ── */
  seedFile(
    {
      clientName: "Angela Park",
      phone: "(555) 789-0123",
      email: "angela.park@email.com",
      side: "listing",
      propertyAddress: "5610 Shoal Creek Blvd, Austin, TX 78756",
      isReferral: false,
      isRelocation: false,
      builtBefore1978: false,
      leadSource: "Instagram",
    },
    {
      status: "closed",
      listPrice: 395000,
      openedDaysAgo: 96,
      completedTasks: 99,
      receivedDocs: 99,
      closingDate: subDays(new Date(), 5).toISOString(),
      commissionRate: 0.03,
      earnestMoney: 5000,
      earnestReceived: true,
      offers: [
        offer("Delgado Family Trust", 395000, 45, "accepted", {
          earnestMoney: 5000,
          financing: "cash",
          contingencies: "Inspection only",
          proposedClosingDate: subDays(new Date(), 5).toISOString(),
        }),
      ],
      notes: [
        { body: "Closed on time with no repair negotiation. Cash buyer, clean file start to finish.", daysAgo: 5 },
      ],
      emails: [
        { templateId: "post_close", subject: "Congratulations, Angela Park", daysAgo: 4 },
        { templateId: "closing_reminder", subject: "Closing is coming up — 5610 Shoal Creek Blvd", daysAgo: 9 },
      ],
      enrichWork: enrichShoalCreek,
    }
  ),

  /* ── Terminated after acceptance — the deal that did not close ── */
  seedFile(
    {
      clientName: "Patricia & Howard Kim",
      phone: "(555) 901-2345",
      email: "kim.family@email.com",
      side: "listing",
      propertyAddress: "902 Riverside Dr, Austin, TX 78741",
      isReferral: false,
      isRelocation: false,
      builtBefore1978: true,
      leadSource: "Sign Call",
    },
    {
      status: "terminated",
      listPrice: 520000,
      openedDaysAgo: 74,
      completedTasks: 16,
      receivedDocs: 6,
      commissionRate: 0.03,
      earnestMoney: 6000,
      earnestReceived: true,
      offers: [
        offer("N. Abernathy", 500000, 20, "accepted", {
          earnestMoney: 6000,
          financing: "fha",
          contingencies: "Inspection, Financing, Appraisal",
          notes: "Buyer's financing fell through in underwriting at day 24.",
        }),
      ],
      notes: [
        {
          body: "Buyer's loan was denied in underwriting — undisclosed debt surfaced late. Termination signed, earnest money released back to the buyer per the financing contingency.",
          daysAgo: 4,
        },
        {
          body: "Sellers want to relist in the spring rather than take a price cut now. Keeping the file open for the follow-up.",
          daysAgo: 3,
        },
      ],
    }
  ),

  /* ── Dropped buyer lead ── */
  seedFile(
    {
      clientName: "Thomas Greene",
      phone: "(555) 890-1234",
      email: "thomas.g@email.com",
      side: "buying",
      propertyAddress: "Condo in downtown Austin — $300K to $400K",
      isReferral: false,
      isRelocation: false,
      leadSource: "Zillow",
    },
    {
      status: "dropped",
      listPrice: 350000,
      openedDaysAgo: 60,
      completedTasks: 2,
      receivedDocs: 1,
      notes: [
        { body: "Went quiet after three showings. Decided to renew his lease for another year. Re-engage in the spring.", daysAgo: 22 },
      ],
    }
  ),
];

/** The three notification examples the scope document calls out by name. */
export const SEED_NOTIFICATIONS = [
  {
    id: uuid(),
    fileId: SEED_TRANSACTIONS[0].id,
    title: "Deadline in 3 days",
    message: "Closing data sheet is due for 729 Maple Court.",
    type: "urgent" as const,
    read: false,
    createdAt: subHours(new Date(), 2).toISOString(),
  },
  {
    id: uuid(),
    fileId: SEED_TRANSACTIONS[0].id,
    title: "Offer accepted",
    message: "The offer on 729 Maple Court was accepted at $489,000.",
    type: "success" as const,
    read: false,
    createdAt: subDays(new Date(), 1).toISOString(),
  },
  {
    id: uuid(),
    fileId: SEED_TRANSACTIONS[1].id,
    title: "Document received",
    message: "HOA documents received for 1842 Oakwood Drive.",
    type: "info" as const,
    read: false,
    createdAt: subDays(new Date(), 2).toISOString(),
  },
  {
    id: uuid(),
    fileId: SEED_TRANSACTIONS[2].id,
    title: "New message",
    message: "Marcus Williams asked about a Thursday showing.",
    type: "info" as const,
    read: true,
    createdAt: subHours(new Date(), 5).toISOString(),
  },
];
