"use client";

import Link from "next/link";
import { ArrowUpRight, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { WorkReadiness } from "@/types";
import { cn } from "@/lib/utils/cn";

const READY_STYLES: Record<WorkReadiness, string> = {
  empty: "bg-ink-100 text-ink-500",
  in_progress: "bg-amber-100 text-amber-800",
  ready: "bg-emerald-100 text-emerald-800",
};

const READY_LABEL: Record<WorkReadiness, string> = {
  empty: "Not started",
  in_progress: "In progress",
  ready: "Ready",
};

export function WorkStatusChip({ status }: { status: WorkReadiness }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[13px] font-semibold",
        READY_STYLES[status]
      )}
    >
      {READY_LABEL[status]}
    </span>
  );
}

export function WorkInstructions({
  title,
  steps,
  externalNote,
}: {
  title: string;
  steps: string[];
  externalNote?: string;
}) {
  return (
    <div className="rounded-2xl border border-itera-100 bg-itera-50/40 px-4 py-3.5">
      <div className="flex items-start gap-2.5">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-itera-600" />
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold text-ink-900">{title}</p>
          <ul className="mt-2 space-y-1">
            {steps.map((step) => (
              <li key={step} className="text-[12.5px] leading-relaxed text-ink-600">
                <span className="mr-1.5 text-itera-500">•</span>
                {step}
              </li>
            ))}
          </ul>
          {externalNote && (
            <p className="mt-2 text-[13px] text-ink-500">
              <Badge variant="gray" className="mr-1.5">
                External
              </Badge>
              {externalNote}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function DeepLinkBanner({
  href,
  label,
  description,
}: {
  href: string;
  label: string;
  description: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-hairline bg-surface px-4 py-3.5">
      <div>
        <p className="text-[14px] font-semibold text-ink-900">{label}</p>
        <p className="mt-0.5 text-[13px] text-ink-500">{description}</p>
      </div>
      <Link href={href}>
        <Button variant="secondary" size="sm">
          Open full view
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Button>
      </Link>
    </div>
  );
}

export function SoftCompleteNudge({
  ready,
  taskTitle,
  taskCompleted,
  onComplete,
}: {
  ready: boolean;
  taskTitle: string;
  taskCompleted: boolean;
  onComplete: () => void;
}) {
  if (!ready || taskCompleted) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 px-4 py-3">
      <p className="text-[14px] text-emerald-900">
        Key fields look complete — mark <span className="font-semibold">{taskTitle}</span> done on
        the checklist?
      </p>
      <Button size="sm" onClick={onComplete}>
        Mark complete
      </Button>
    </div>
  );
}
