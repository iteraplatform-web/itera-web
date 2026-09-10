"use client";

import { use, useMemo } from "react";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { AnalyticsSection } from "@/components/workspace/analytics-section";
import { useTransactionsStore } from "@/stores";
import { getFileById } from "@/lib/selectors/transactions";
import { ensureWorkFields } from "@/lib/work/defaults";

export default function AnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const files = useTransactionsStore((s) => s.files);
  const file = useMemo(() => {
    const raw = getFileById(files, id);
    return raw ? ensureWorkFields(raw) : undefined;
  }, [files, id]);

  return (
    <WorkspaceShell
      id={id}
      section="analytics"
      title="File analytics"
      blurb="Days on market, showings, offers, and checklist progress derived from work on this file."
    >
      {file && <AnalyticsSection file={file} full />}
    </WorkspaceShell>
  );
}
