"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { FileHeaderCompact } from "@/components/workspace/file-header";
import { FileSectionNav, navFor, SubTabs } from "@/components/workspace/workspace-sidebar";
import { QuickLeadPrompt } from "@/components/workspace/quick-lead-prompt";
import { Button } from "@/components/ui/button";
import { useTransactionsStore } from "@/stores";
import { useNotificationsStore } from "@/stores/notifications-store";
import { getFileById } from "@/lib/selectors/transactions";
import { STATUS_THEME } from "@/lib/utils/status-theme";
import { SECTION_LABELS, type TransactionStatus, type WorkspaceSection } from "@/types";
import { ensureWorkFields } from "@/lib/work/defaults";

export const SECTION_META: Record<WorkspaceSection, { title: string; blurb: string }> = {
  overview: {
    title: "Overview",
    blurb: "What needs you on this file today — and one click to each thing.",
  },
  checklist: {
    title: "Checklist",
    blurb: "Every task in order. Each one has a button that takes you to where it gets done.",
  },
  client_profile: {
    title: "Client Profile",
    blurb: "Who the client is, how the relationship started, and anything extra worth remembering.",
  },
  pricing: {
    title: "Pricing / CMA",
    blurb: "Comparables, adjustments, and the pricing recommendation presented to the seller.",
  },
  listing_details: {
    title: "Listing Details",
    blurb: "The property sheet, kept here as the record. The live MLS entry stays in the MLS.",
  },
  property_work: {
    title: "Prep & Staging",
    blurb: "Repairs, staging, and the photography plan before the listing goes live.",
  },
  photos: {
    title: "Photos",
    blurb: "Upload property photos, choose the cover image, and add captions.",
  },
  showings: {
    title: "Showings",
    blurb: "Access instructions, appointments, and feedback from each showing.",
  },
  marketing: {
    title: "Marketing",
    blurb: "Campaign activity and open houses — or the buyer's search criteria.",
  },
  documents: {
    title: "Documents",
    blurb: "Upload paperwork as it arrives. Anything still missing is listed first.",
  },
  communications: {
    title: "Emails & Messages",
    blurb: "Ready-made emails that fill themselves in, and your conversation with the client.",
  },
  financials: {
    title: "Offers & Money",
    blurb: "Offers side by side, earnest money, and exactly what you will be paid.",
  },
  milestones: {
    title: "Milestones & Agreements",
    blurb: "Agreements, inspection, appraisal, title, and closing progress.",
  },
  notes: {
    title: "Notes & Activity",
    blurb: "Private notes, and the full record of who did what and when.",
  },
  analytics: {
    title: "Analytics",
    blurb: "Days on market, showings, offers, and checklist progress for this file.",
  },
  client_view: {
    title: "What the Client Sees",
    blurb: "Exactly what your client sees on their own phone.",
  },
};

export function WorkspaceShell({
  id,
  children,
  section,
  title,
  blurb,
}: {
  id: string;
  children: React.ReactNode;
  section: WorkspaceSection;
  title?: string;
  blurb?: string;
}) {
  const files = useTransactionsStore((s) => s.files);
  const raw = useMemo(() => getFileById(files, id), [files, id]);
  const file = useMemo(() => (raw ? ensureWorkFields(raw) : undefined), [raw]);
  const updateFileStatus = useTransactionsStore((s) => s.updateFileStatus);
  const addNotification = useNotificationsStore((s) => s.addNotification);

  const meta = SECTION_META[section];

  const handleStatusChange = (status: TransactionStatus) => {
    if (!file || file.status === status) return;
    const prevLabel = STATUS_THEME[file.status].label;
    const newLabel = STATUS_THEME[status].label;
    updateFileStatus(file.id, status);
    addNotification({
      fileId: file.id,
      title: "Status changed",
      message: `${file.propertyAddress}: ${prevLabel} → ${newLabel}`,
      type: "info",
    });
  };

  if (!file) {
    return (
      <AppShell crumbs={[{ label: "Home", href: "/dashboard" }, { label: "File not found" }]}>
        <div className="mx-auto max-w-md py-24 text-center">
          <p className="text-[18px] font-semibold text-ink-900">File not found</p>
          <p className="mt-2 text-[15px] text-ink-500">It may have been removed, or the link is out of date.</p>
          <Link href="/dashboard" className="mt-6 inline-block">
            <Button variant="secondary">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  const crumbs = [
    { label: "Home", href: "/dashboard" },
    { label: file.propertyAddress || file.clientName, href: section === "overview" ? undefined : `/files/${id}` },
    ...(section === "overview" ? [] : [{ label: SECTION_LABELS[section] }]),
  ];

  return (
    <AppShell crumbs={crumbs} file={file} activeSection={section}>
      <div className="mx-auto max-w-[1280px]">
        {/* Sections live in the drawer on small screens; keep them one swipe away */}
        <div className="mb-4 space-y-3 lg:hidden">
          <Link href="/dashboard">
            <Button variant="secondary" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <FileSectionNav file={file} active={section} variant="rail" />
        </div>

        <FileHeaderCompact file={file} onStatusChange={handleStatusChange} />

        {file.isQuickLead && (
          <div className="mt-5">
            <QuickLeadPrompt file={file} />
          </div>
        )}

        <div className="mt-6">
          <div className="mb-4">
            <h1 className="font-serif text-[32px] font-medium leading-tight tracking-[-0.01em] text-ink-950">{title ?? navFor(section, file).label}</h1>
            <p className="mt-1 text-[16px] text-ink-600">{blurb ?? meta.blurb}</p>
          </div>
          <SubTabs file={file} active={section} />
          {/* Overview lays out its own panels; every other section sits in one card. */}
          {section === "overview" ? (
            children
          ) : (
            <div className="rounded-2xl border border-hairline bg-surface p-5 shadow-sm sm:p-7">{children}</div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
