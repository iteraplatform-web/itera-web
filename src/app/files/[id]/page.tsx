"use client";

import { Suspense, use, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { OverviewSection } from "@/components/workspace/overview-section";
import { ChecklistSection } from "@/components/workspace/checklist-section";
import { DocumentsSection } from "@/components/workspace/documents-section";
import { PhotosSection } from "@/components/workspace/photos-section";
import { CommunicationsSection } from "@/components/workspace/communications-section";
import { FinancialsSection } from "@/components/workspace/financials-section";
import { NotesSection } from "@/components/workspace/notes-section";
import { ClientViewPreview } from "@/components/workspace/client-view-preview";
import { ClientProfileSection } from "@/components/workspace/client-profile-section";
import { PricingSection } from "@/components/workspace/pricing-section";
import { ListingDetailsSection } from "@/components/workspace/listing-details-section";
import { PropertyWorkSection } from "@/components/workspace/property-work-section";
import { ShowingsSection } from "@/components/workspace/showings-section";
import { MarketingSection } from "@/components/workspace/marketing-section";
import { MilestonesSection } from "@/components/workspace/milestones-section";
import { AnalyticsSection } from "@/components/workspace/analytics-section";
import { LoadingScreen } from "@/components/layout/auth-guard";
import { NewFileWelcome } from "@/components/workspace/new-file-welcome";
import { useTransactionsStore } from "@/stores";
import { getFileById } from "@/lib/selectors/transactions";
import { ensureWorkFields } from "@/lib/work/defaults";
import { SECTION_LABELS, type WorkspaceSection } from "@/types";

export default function FilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Suspense fallback={<LoadingScreen />}>
      <FileContent id={id} />
    </Suspense>
  );
}

/**
 * The tab lives in the URL (?tab=documents&focus=Listing%20Agreement), so a
 * checklist button, a notification, or a bookmark can open exactly the right
 * place — and the browser's Back button behaves as people expect.
 */
function FileContent({ id }: { id: string }) {
  const params = useSearchParams();
  const tabParam = params.get("tab");
  const focus = params.get("focus") ?? undefined;
  const welcome = params.get("welcome") === "1";
  const section: WorkspaceSection =
    tabParam && tabParam in SECTION_LABELS ? (tabParam as WorkspaceSection) : "overview";

  const files = useTransactionsStore((s) => s.files);
  const file = useMemo(() => {
    const raw = getFileById(files, id);
    return raw ? ensureWorkFields(raw) : undefined;
  }, [files, id]);

  return (
    <WorkspaceShell id={id} section={section}>
      {file && welcome && <NewFileWelcome file={file} />}
      {file && (
        <div key={section} className="animate-fade-in">
          {section === "overview" && <OverviewSection file={file} />}
          {section === "checklist" && <ChecklistSection file={file} focus={focus} />}
          {section === "client_profile" && <ClientProfileSection file={file} />}
          {section === "pricing" && <PricingSection file={file} full />}
          {section === "listing_details" && <ListingDetailsSection file={file} full />}
          {section === "property_work" && <PropertyWorkSection file={file} />}
          {section === "photos" && <PhotosSection file={file} />}
          {section === "showings" && <ShowingsSection file={file} />}
          {section === "marketing" && <MarketingSection file={file} />}
          {section === "documents" && <DocumentsSection file={file} focus={focus} />}
          {section === "communications" && <CommunicationsSection file={file} focus={focus} />}
          {section === "financials" && <FinancialsSection file={file} focus={focus} />}
          {section === "milestones" && <MilestonesSection file={file} />}
          {section === "notes" && <NotesSection file={file} />}
          {section === "analytics" && <AnalyticsSection file={file} full />}
          {section === "client_view" && <ClientViewPreview file={file} />}
        </div>
      )}
    </WorkspaceShell>
  );
}
