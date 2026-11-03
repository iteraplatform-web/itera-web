"use client";

import { useMemo } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { VisitsBoard } from "@/components/visits/visits-board";
import { useTransactionsStore } from "@/stores";
import { ensureWorkFields } from "@/lib/work/defaults";

export default function VisitsPage() {
  const files = useTransactionsStore((s) => s.files);
  const ready = useMemo(
    () => files.map(ensureWorkFields).sort((a, b) => folderSort(a.propertyAddress, b.propertyAddress)),
    [files]
  );

  return (
    <AppShell crumbs={[{ label: "Home", href: "/dashboard" }, { label: "Visits" }]}>
      <div className="mx-auto max-w-4xl space-y-5">
        <div>
          <h1 className="font-serif text-[34px] font-medium leading-tight tracking-[-0.01em] text-ink-950">
            Visits
          </h1>
          <p className="mt-1 max-w-2xl text-[15px] leading-relaxed text-ink-500">
            Every house visit across your folders. A booking from ShowingTime would appear
            here by itself once Gmail is connected. In this demo you add it by hand, then
            add feedback after the visit.
          </p>
        </div>
        <VisitsBoard files={ready} />
      </div>
    </AppShell>
  );
}

function folderSort(a: string, b: string) {
  return (a || "").localeCompare(b || "");
}
