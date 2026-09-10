"use client";

import { use, useMemo } from "react";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { PricingSection } from "@/components/workspace/pricing-section";
import { useTransactionsStore } from "@/stores";
import { getFileById } from "@/lib/selectors/transactions";
import { ensureWorkFields } from "@/lib/work/defaults";

export default function PricingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const files = useTransactionsStore((s) => s.files);
  const file = useMemo(() => {
    const raw = getFileById(files, id);
    return raw ? ensureWorkFields(raw) : undefined;
  }, [files, id]);

  return (
    <WorkspaceShell
      id={id}
      section="pricing"
      title="Pricing / CMA"
      blurb="Comparables, adjustments, and the pricing recommendation — full workspace."
    >
      {file && <PricingSection file={file} full />}
    </WorkspaceShell>
  );
}
