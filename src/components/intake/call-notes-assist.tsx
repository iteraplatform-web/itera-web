"use client";

import { useState } from "react";
import { Check, Loader2, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import {
  extractFromCallNotes,
  SAMPLE_CALL_NOTES,
  type ExtractedField,
} from "@/lib/checklist/engine";
import type { IntakeAnswers } from "@/types";
import { cn } from "@/lib/utils/cn";

/**
 * Paste the notes from a call, get the useful details back for confirmation.
 * Nothing is applied until the agent accepts it — the roadmap is explicit that
 * extracted detail is "offered back for confirmation", never filled in silently.
 */
export function CallNotesAssist({
  onApply,
}: {
  onApply: (values: Partial<IntakeAnswers>) => void;
}) {
  const [notes, setNotes] = useState("");
  const [state, setState] = useState<"idle" | "reading" | "done">("idle");
  const [found, setFound] = useState<ExtractedField[]>([]);
  const [accepted, setAccepted] = useState<Set<string>>(new Set());

  const read = () => {
    if (!notes.trim()) return;
    setState("reading");
    // A brief pause so the step reads as work being done rather than a no-op.
    setTimeout(() => {
      const fields = extractFromCallNotes(notes);
      setFound(fields);
      setAccepted(new Set(fields.map((f) => f.field)));
      setState("done");
    }, 900);
  };

  const toggle = (field: string) =>
    setAccepted((prev) => {
      const next = new Set(prev);
      if (next.has(field)) next.delete(field);
      else next.add(field);
      return next;
    });

  const apply = () => {
    const values: Partial<IntakeAnswers> = {};
    found
      .filter((f) => accepted.has(f.field))
      .forEach((f) => {
        // Each extracted field is keyed by its name on IntakeAnswers.
        (values as Record<string, unknown>)[f.field] = f.value;
      });
    onApply(values);
  };

  return (
    <div className="rounded-2xl border border-itera-200 bg-itera-50/50 p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-itera-100 text-itera-600">
          <Wand2 className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold text-ink-950">
            Paste your notes from the call
          </p>
          <p className="mt-0.5 text-[13px] leading-snug text-ink-500">
            ITERA pulls out the details it recognises and offers them back for you
            to confirm. Nothing is filled in without your say-so.
          </p>
        </div>
      </div>

      <div className="mt-3.5">
        <Textarea
          id="callNotes"
          rows={4}
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            setState("idle");
          }}
          placeholder="Spoke with Daniel Okafor this morning — referral from the Hartley team. Selling 4118 Meadowbrook Lane…"
        />

        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={read} disabled={!notes.trim() || state === "reading"}>
            {state === "reading" ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Reading…
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                Pull out the details
              </>
            )}
          </Button>
          {!notes && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setNotes(SAMPLE_CALL_NOTES);
                setState("idle");
              }}
            >
              Use example notes
            </Button>
          )}
        </div>
      </div>

      {state === "done" && (
        <div className="mt-4 animate-fade-in border-t border-itera-200 pt-4">
          {found.length === 0 ? (
            <p className="text-[14px] text-ink-500">
              Nothing recognisable in those notes — fill the fields in below instead.
            </p>
          ) : (
            <>
              <p className="text-[13px] font-semibold text-ink-900">
                Found {found.length} detail{found.length === 1 ? "" : "s"} — untick anything
                that&apos;s wrong.
              </p>

              <ul className="mt-2.5 space-y-1.5">
                {found.map((f) => {
                  const isOn = accepted.has(f.field);
                  return (
                    <li key={f.field}>
                      <button
                        onClick={() => toggle(f.field)}
                        className={cn(
                          "flex w-full items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all",
                          isOn
                            ? "border-itera-200 bg-surface shadow-xs"
                            : "border-hairline bg-transparent opacity-55"
                        )}
                      >
                        <span
                          className={cn(
                            "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded transition-colors",
                            isOn ? "bg-itera-600 text-white" : "bg-surface ring-1 ring-inset ring-ink-300"
                          )}
                        >
                          {isOn && <Check className="h-2.5 w-2.5" strokeWidth={3.5} />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-baseline gap-x-2">
                            <span className="text-[13px] font-medium uppercase tracking-wide text-ink-500">
                              {f.label}
                            </span>
                            <span className="text-[14px] font-semibold text-ink-950">
                              {f.display}
                            </span>
                          </span>
                          <span className="mt-1 block truncate text-[13px] italic text-ink-500">
                            &ldquo;{f.evidence}&rdquo;
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              <Button
                size="sm"
                className="mt-3 w-full"
                onClick={apply}
                disabled={accepted.size === 0}
              >
                Fill in {accepted.size} field{accepted.size === 1 ? "" : "s"}
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
