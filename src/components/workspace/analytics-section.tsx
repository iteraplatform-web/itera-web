"use client";

import { BarChart3 } from "lucide-react";
import { SectionLabel } from "@/components/ui/card";
import { DeepLinkBanner } from "@/components/workspace/work-ui";
import { PHASE_LABELS, type TransactionFile } from "@/types";
import { fileAnalytics } from "@/lib/work/readiness";
import { Progress } from "@/components/ui/progress";

export function AnalyticsSection({
  file,
  full = false,
}: {
  file: TransactionFile;
  full?: boolean;
}) {
  const a = fileAnalytics(file);

  return (
    <div className="space-y-6">
      <SectionLabel icon={BarChart3}>This file</SectionLabel>

      {!full && (
        <DeepLinkBanner
          href={`/files/${file.id}/analytics`}
          label="Open full analytics"
          description="Phase progress, sentiment mix, and milestone timeline."
        />
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Days on market"
          value={a.daysOnMarket !== null ? String(a.daysOnMarket) : "—"}
        />
        <Stat label="Showings" value={String(a.showingCount)} />
        <Stat label="Offers" value={String(a.offerCount)} />
        <Stat
          label="Checklist"
          value={`${a.checklistDone}/${a.checklistTotal}`}
        />
      </div>

      {a.offerCount > 0 && (
        <p className="text-[14px] text-ink-600">
          Offer range:{" "}
          <span className="tnum font-semibold text-ink-900">
            ${a.offerLow!.toLocaleString()} – ${a.offerHigh!.toLocaleString()}
          </span>
        </p>
      )}

      {a.showingCount > 0 && (
        <div>
          <p className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-ink-500">
            Showing sentiment
          </p>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["hot", a.sentiment.hot],
                ["warm", a.sentiment.warm],
                ["cool", a.sentiment.cool],
                ["pass", a.sentiment.pass],
              ] as const
            ).map(([k, v]) => (
              <span
                key={k}
                className="rounded-full bg-canvas px-3 py-1 text-[13px] font-semibold text-ink-700 ring-1 ring-inset ring-hairline"
              >
                {k}: {v}
              </span>
            ))}
          </div>
        </div>
      )}

      {full && (
        <>
          <div>
            <p className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-ink-500">
              Checklist by phase
            </p>
            <div className="space-y-3">
              {Object.entries(a.phaseProgress).map(([phase, stats]) => (
                <div key={phase}>
                  <div className="mb-1 flex justify-between text-[13px]">
                    <span className="font-medium text-ink-700">
                      {PHASE_LABELS[phase as keyof typeof PHASE_LABELS] ?? phase}
                    </span>
                    <span className="tnum text-ink-500">
                      {stats.done}/{stats.total}
                    </span>
                  </div>
                  <Progress value={stats.total ? (stats.done / stats.total) * 100 : 0} />
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-ink-500">
              Milestone timeline
            </p>
            <div className="space-y-2">
              {a.milestones.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-hairline px-3 py-2 text-[14px]"
                >
                  <span className="font-medium text-ink-800">{m.title}</span>
                  <span className="text-[13px] font-semibold uppercase tracking-wide text-ink-500">
                    {m.status.replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-hairline bg-canvas/60 px-4 py-3">
      <p className="text-[13px] font-semibold uppercase tracking-wide text-ink-500">{label}</p>
      <p className="tnum mt-1 text-[22px] font-bold tracking-[-0.02em] text-ink-950">{value}</p>
    </div>
  );
}
