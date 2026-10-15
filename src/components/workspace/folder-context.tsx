"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { NotebookPen } from "lucide-react";
import { useTransactionsStore } from "@/stores";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { DealContactsCard } from "@/components/workspace/deal-contacts";
import { sectionHref } from "@/components/workspace/workspace-sidebar";
import { listingExpiryWarning, listingTermEnd } from "@/lib/work/listing-expiry";
import type { TransactionFile } from "@/types";

/**
 * The short story of this folder. Goals are shown from the client profile
 * and are not saved from here.
 */
export function FolderContextCard({ file }: { file: TransactionFile }) {
  const updateFolderContext = useTransactionsStore((s) => s.updateFolderContext);
  const saved = file.folderContext?.story ?? "";
  const [story, setStory] = useState(saved);
  const goals = file.clientProfile?.goals?.trim() ?? "";
  const listingEnds = file.side === "listing" ? listingTermEnd(file) : undefined;
  const warning = listingExpiryWarning(file);
  const dirty = story.trim() !== saved;

  useEffect(() => {
    setStory(saved);
  }, [saved]);

  return (
    <section className="overflow-hidden rounded-2xl border border-hairline bg-surface shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-5 py-4">
        <h2 className="flex items-center gap-2.5 text-[17px] font-semibold text-ink-950">
          <NotebookPen className="h-5 w-5 text-ink-500" />
          Context
        </h2>
        <StatusBadge status={file.status} />
      </header>

      <div className="space-y-4 px-5 py-4">
        <div>
          <p className="text-[18px] font-semibold text-ink-950">{file.clientName || "No client yet"}</p>
          <p className="mt-1 text-[15px] text-ink-600">
            {goals ? (
              goals
            ) : (
              <>
                No goals yet.{" "}
                <Link href={sectionHref(file.id, "client_profile")} className="font-semibold text-itera-700">
                  Add them on the client profile
                </Link>
              </>
            )}
          </p>
          {goals && (
            <Link href={sectionHref(file.id, "client_profile")} className="mt-1 inline-block text-[13px] font-semibold text-itera-700">
              Goals live on the client profile
            </Link>
          )}
        </div>

        {listingEnds && (
          <p className="text-[14px] text-ink-700">
            Listing expires {format(parseISO(listingEnds), "EEE, MMM d, yyyy")}
            {file.status === "expired"
              ? " — this listing is expired."
              : warning
                ? warning.daysLeft === 0
                  ? " — today."
                  : ` — ${warning.daysLeft} day${warning.daysLeft === 1 ? "" : "s"} left.`
                : "."}
          </p>
        )}

        <Textarea
          id={`context-${file.id}`}
          label="What is unusual, and what matters right now"
          hint="Saved on this folder only. It does not change the client profile."
          rows={4}
          value={story}
          onChange={(e) => setStory(e.target.value)}
          placeholder="Cameras on the doorbell, a tight deadline, a divorce, anything the next call needs."
        />
        <div className="flex justify-end">
          <Button onClick={() => updateFolderContext(file.id, story)} disabled={!dirty}>
            Save context
          </Button>
        </div>
      </div>

      <DealContactsCard file={file} embedded />
    </section>
  );
}
