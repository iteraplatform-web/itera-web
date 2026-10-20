"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { ChevronRight, NotebookPen, X } from "lucide-react";
import { useTransactionsStore } from "@/stores";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { sectionHref } from "@/components/workspace/workspace-sidebar";
import { listingExpiryWarning, listingTermEnd } from "@/lib/work/listing-expiry";
import type { TransactionFile } from "@/types";

/**
 * Folder notes stay one click away in a side panel, so the overview can lead
 * with the work: next steps, dates, and documents.
 */
export function FolderContextCard({ file }: { file: TransactionFile }) {
  const updateFolderContext = useTransactionsStore((s) => s.updateFolderContext);
  const saved = file.folderContext?.story ?? "";
  const [story, setStory] = useState(saved);
  const [open, setOpen] = useState(false);
  const goals = file.clientProfile?.goals?.trim() ?? "";
  const listingEnds = file.side === "listing" ? listingTermEnd(file) : undefined;
  const warning = listingExpiryWarning(file);
  const dirty = story.trim() !== saved;
  const launcherRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const titleId = useId();
  const fieldId = `context-${file.id}`;

  useEffect(() => {
    setStory(saved);
  }, [saved]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      launcherRef.current?.focus();
    };
  }, [open]);

  const preview = (story.trim() || goals || "Add what is unusual, and what the next call needs.").replace(/\s+/g, " ");

  const drawer =
    open && typeof document !== "undefined"
      ? createPortal(
          <div className="fixed inset-0 z-85">
            <div className="absolute inset-0 animate-fade-in bg-ink-950/40" onClick={() => setOpen(false)} />
            <aside
              ref={panelRef}
              id={`${fieldId}-panel`}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              tabIndex={-1}
              className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-surface shadow-xl outline-none animate-slide-in-right"
            >
              <header className="flex items-start justify-between gap-3 border-b border-hairline px-5 py-4">
                <div className="min-w-0">
                  <h2 id={titleId} className="flex items-center gap-2.5 text-[17px] font-semibold text-ink-950">
                    <NotebookPen className="h-5 w-5 text-ink-500" />
                    Context
                  </h2>
                  <p className="mt-1 text-[13px] text-ink-500">Saved on this folder only. It does not change the client profile.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="-mr-1.5 -mt-1 shrink-0 rounded-lg p-1.5 text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-700"
                  aria-label="Close context"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </header>

              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
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
                  id={fieldId}
                  label="What is unusual, and what matters right now"
                  rows={8}
                  value={story}
                  onChange={(e) => setStory(e.target.value)}
                  placeholder="Cameras on the doorbell, a tight deadline, a divorce, anything the next call needs."
                />
              </div>

              <footer className="flex items-center justify-end gap-2 border-t border-hairline bg-canvas px-5 py-4">
                <Button variant="secondary" onClick={() => setOpen(false)}>
                  Close
                </Button>
                <Button onClick={() => updateFolderContext(file.id, story)} disabled={!dirty}>
                  Save context
                </Button>
              </footer>
            </aside>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={file.status} />
        <button
          ref={launcherRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-controls={`${fieldId}-panel`}
          title={preview}
          className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-surface px-3.5 text-[14px] font-semibold text-ink-700 shadow-xs ring-1 ring-inset ring-hairline-strong transition-colors hover:bg-canvas hover:text-ink-950"
        >
          <NotebookPen className="h-4 w-4 text-ink-500" />
          Context
          {dirty ? (
            <span className="text-[12px] font-semibold text-amber-700">Unsaved</span>
          ) : saved.trim() ? (
            <span className="h-1.5 w-1.5 rounded-full bg-itera-500" aria-hidden />
          ) : null}
          <ChevronRight className="h-4 w-4 text-ink-400" />
        </button>
      </div>
      {drawer}
    </>
  );
}
