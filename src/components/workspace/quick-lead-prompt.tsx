"use client";

import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TransactionFile } from "@/types";

/**
 * A quick lead is captured in thirty seconds and carries only a name and a
 * number, so its checklist is a placeholder until the guided questions are
 * answered. This makes that state obvious rather than confusing.
 */
export function QuickLeadPrompt({ file }: { file: TransactionFile }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
          <Zap className="h-4 w-4" />
        </span>
        <div>
          <p className="text-[14px] font-semibold text-amber-900">
            Intake is not finished yet
          </p>
          <p className="mt-0.5 text-[13px] leading-snug text-amber-800">
            {file.clientName} was saved as a quick lead. Answer the guided questions
            and the real checklist builds itself around the answers.
          </p>
        </div>
      </div>

      <Link href={`/files/new?full=true&complete=${file.id}`} className="shrink-0">
        <Button size="sm">
          Complete intake
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </Link>
    </div>
  );
}
