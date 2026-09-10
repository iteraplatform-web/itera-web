"use client";

import Link from "next/link";
import { ExternalLink, Eye, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClientHome } from "@/components/client/portal/client-home";
import type { TransactionFile } from "@/types";

/**
 * The client's portal home, rendered from the same component the client
 * uses — so what the agent previews is exactly what the client gets.
 */
export function ClientViewPreview({ file }: { file: TransactionFile }) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-2xl bg-canvas p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface text-ink-600 ring-1 ring-hairline">
            <Eye className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[16px] font-semibold text-ink-950">This is {file.clientName.split(" ")[0]}&apos;s portal home</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-[14px] text-ink-500">
              <Lock className="h-3.5 w-3.5" />
              They see milestones, documents, messages, and estimates — never your notes or internal checklist.
            </p>
          </div>
        </div>
        <Link href={`/client/${file.id}`} target="_blank" className="shrink-0">
          <Button variant="secondary">
            <ExternalLink className="h-4 w-4" />
            Open the full portal
          </Button>
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-hairline-strong shadow-lg">
        <div className="flex items-center gap-2 border-b border-hairline bg-canvas-deep px-4 py-2.5">
          <span className="h-3 w-3 rounded-full bg-ink-200" />
          <span className="h-3 w-3 rounded-full bg-ink-200" />
          <span className="h-3 w-3 rounded-full bg-ink-200" />
          <span className="ml-3 truncate rounded-md bg-surface px-3 py-1 text-[13px] text-ink-500 ring-1 ring-hairline">
            portal.itera.app/{file.clientName.split(" ")[0].toLowerCase()}
          </span>
        </div>
        {/* Preview only — clicks would take the agent into the client's session. */}
        <div className="pointer-events-none max-h-[900px] overflow-hidden bg-canvas p-5 sm:p-7" aria-hidden>
          <ClientHome file={file} unread={0} readOnly />
        </div>
      </div>
    </div>
  );
}
