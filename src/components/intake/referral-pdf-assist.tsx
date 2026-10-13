"use client";

import { useEffect, useRef, useState } from "react";
import { Check, FileUp, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  buildReferralPdf,
  readReferralPdf,
  SAMPLE_REFERRAL,
  type ReferralField,
  type ReferralProfile,
  type ReferralRead,
} from "@/lib/referral/form";
import type { IntakeAnswers } from "@/types";
import { cn } from "@/lib/utils/cn";

export function ReferralPdfAssist({
  onApply,
}: {
  onApply: (values: Partial<IntakeAnswers>, profile: ReferralProfile | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [state, setState] = useState<"idle" | "reading" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [found, setFound] = useState<ReferralField[]>([]);
  const [summary, setSummary] = useState("");
  const [profile, setProfile] = useState<ReferralProfile | null>(null);
  const [accepted, setAccepted] = useState<Set<string>>(new Set());
  const [useProfile, setUseProfile] = useState(true);
  const [applied, setApplied] = useState(false);

  const run = (file: Blob, name: string) => {
    setFileName(name);
    setState("reading");
    setError("");
    window.setTimeout(async () => {
      const result = await readReferralPdf(file);
      if ("error" in result) {
        setState("error");
        setError(result.error);
        setFound([]);
        setProfile(null);
        return;
      }
      show(result);
    }, 700);
  };

  const show = (result: ReferralRead) => {
    setFound(result.fields);
    setSummary(result.summary);
    setProfile(result.profile);
    setAccepted(new Set(result.fields.map((field) => field.field)));
    setUseProfile(true);
    setApplied(false);
    setState("done");
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
      .filter((field) => accepted.has(field.field))
      .forEach((field) => {
        (values as Record<string, unknown>)[field.field] = field.value;
      });
    onApply(values, useProfile ? profile : null);
    setApplied(true);
  };

  useEffect(() => {
    if (!applied) return;
    document.getElementById("clientName")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [applied]);

  return (
    <div className="rounded-2xl border border-itera-200 bg-itera-50/50 p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-itera-100 text-itera-600">
          <FileUp className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold text-ink-950">Upload a referral form</p>
          <p className="mt-0.5 text-[13px] leading-snug text-ink-500">
            ITERA reads the PDF, writes a short profile, and waits for you to accept it.
            Nothing is saved until you say so.
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) run(file, file.name);
        }}
      />

      <div className="mt-3.5 flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => inputRef.current?.click()}
          disabled={state === "reading"}
        >
          {state === "reading" ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Reading…
            </>
          ) : (
            <>
              <FileUp className="h-3.5 w-3.5" />
              Choose PDF
            </>
          )}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={state === "reading"}
          onClick={() => run(buildReferralPdf(SAMPLE_REFERRAL), "sample-referral.pdf")}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Use sample form
        </Button>
        {fileName && state !== "reading" && (
          <span className="truncate text-[13px] text-ink-500">{fileName}</span>
        )}
      </div>

      {state === "error" && <p className="mt-3 text-[14px] text-ink-600">{error}</p>}

      {state === "done" && applied && (
        <div className="mt-4 animate-fade-in border-t border-itera-200 pt-4">
          <p className="text-[14px] font-semibold text-ink-950">Added to the form below.</p>
          <ul className="mt-2 space-y-1">
            {found
              .filter((field) => accepted.has(field.field))
              .slice(0, 4)
              .map((field) => (
                <li key={field.field} className="text-[14px] text-ink-700">
                  <span className="text-ink-500">{field.label}: </span>
                  {field.display}
                </li>
              ))}
          </ul>
          {useProfile && (
            <p className="mt-2 text-[13px] leading-relaxed text-ink-500">
              The client profile will be saved when you create the file.
            </p>
          )}
          <Button type="button" size="sm" variant="ghost" className="mt-2" onClick={() => setApplied(false)}>
            Change details
          </Button>
        </div>
      )}

      {state === "done" && !applied && (
        <div className="mt-4 animate-fade-in border-t border-itera-200 pt-4">
          <p className="text-[13px] font-semibold text-ink-900">AI analysis</p>
          <button
            type="button"
            onClick={() => setUseProfile((on) => !on)}
            className={cn(
              "mt-2 flex w-full items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left",
              useProfile
                ? "border-itera-200 bg-surface shadow-xs"
                : "border-hairline bg-transparent opacity-55"
            )}
          >
            <Tick on={useProfile} />
            <span className="text-[14px] leading-relaxed text-ink-800">{summary}</span>
          </button>
          <p className="mt-1.5 text-[12px] text-ink-500">
            Untick this if you do not want the profile written from the form.
          </p>

          <p className="mt-4 text-[13px] font-semibold text-ink-900">
            Details to fill in — untick anything wrong.
          </p>
          <ul className="mt-2.5 space-y-1.5">
            {found.map((field) => {
              const isOn = accepted.has(field.field);
              return (
                <li key={field.field}>
                  <button
                    type="button"
                    onClick={() => toggle(field.field)}
                    className={cn(
                      "flex w-full items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left",
                      isOn
                        ? "border-itera-200 bg-surface shadow-xs"
                        : "border-hairline bg-transparent opacity-55"
                    )}
                  >
                    <Tick on={isOn} />
                    <span className="min-w-0">
                      <span className="block text-[12px] font-medium text-ink-500">{field.label}</span>
                      <span className="block text-[14px] font-medium text-ink-950">{field.display}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-3">
            <Button
              type="button"
              size="sm"
              onClick={apply}
              disabled={accepted.size === 0 && !useProfile}
            >
              <Check className="h-3.5 w-3.5" />
              Use these details
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Tick({ on }: { on: boolean }) {
  return (
    <span
      className={cn(
        "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded",
        on ? "bg-itera-600 text-white" : "bg-surface ring-1 ring-inset ring-ink-300"
      )}
    >
      {on && <Check className="h-3 w-3" strokeWidth={3} />}
    </span>
  );
}
