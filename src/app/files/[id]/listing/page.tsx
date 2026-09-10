"use client";

import { use, useMemo } from "react";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { ListingDetailsSection } from "@/components/workspace/listing-details-section";
import { useTransactionsStore } from "@/stores";
import { getFileById } from "@/lib/selectors/transactions";
import { ensureWorkFields } from "@/lib/work/defaults";

export default function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const files = useTransactionsStore((s) => s.files);
  const file = useMemo(() => {
    const raw = getFileById(files, id);
    return raw ? ensureWorkFields(raw) : undefined;
  }, [files, id]);

  return (
    <WorkspaceShell
      id={id}
      section="listing_details"
      title="Listing sheet"
      blurb="Property details as the system of record. Live MLS push stays external."
    >
      {file && <ListingDetailsSection file={file} full />}
    </WorkspaceShell>
  );
}
