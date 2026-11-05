"use client";

import { AlertTriangle } from "lucide-react";
import { Textarea } from "@/components/ui/input";
import {
  alertsFromShowings,
  routineGuidelines,
  visitorAlertLines,
} from "@/lib/work/visitor-alerts";
import type { ShowingsWork, VisitorAlertFields } from "@/types";

/** The boxes the listing agent fills in for cameras and pets. */
export function VisitorAlertsEditor({
  value,
  onChange,
  idPrefix,
}: {
  value: VisitorAlertFields;
  onChange: (next: VisitorAlertFields) => void;
  idPrefix: string;
}) {
  return (
    <div className="space-y-3 rounded-2xl border-2 border-amber-300 bg-amber-50 p-4">
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
        <div>
          <p className="text-[14px] font-semibold text-amber-950">Important for visitors</p>
          <p className="mt-1 text-[14px] leading-relaxed text-amber-900">
            Check a box only when a visitor could be surprised at the door. Everyday rules, like
            ringing the doorbell, go in Visit guidelines below.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex items-start gap-2.5 text-[14px] font-medium text-ink-900">
          <input
            id={`${idPrefix}-cameras-on`}
            type="checkbox"
            className="mt-0.5 h-4 w-4 accent-amber-700"
            checked={value.camerasOn}
            onChange={(e) => onChange({ ...value, camerasOn: e.target.checked })}
          />
          Security cameras are installed and active
        </label>
        {value.camerasOn && !value.cameraNote.trim() && (
          <p className="pl-6 text-[13px] leading-relaxed text-amber-900">
            Visitors will see: Security cameras are on. People in the house are being recorded.
          </p>
        )}
        {value.camerasOn && value.cameraNote.trim() && (
          <SavedVisitorLine
            text={value.cameraNote}
            hint="This older camera note is still shown to visitors. Remove it if the warning above is enough."
            onRemove={() => onChange({ ...value, cameraNote: "" })}
          />
        )}
      </div>

      <div className="space-y-2">
        <label className="flex items-start gap-2.5 text-[14px] font-medium text-ink-900">
          <input
            id={`${idPrefix}-pets-on`}
            type="checkbox"
            className="mt-0.5 h-4 w-4 accent-amber-700"
            checked={value.petsOnSite}
            onChange={(e) => onChange({ ...value, petsOnSite: e.target.checked })}
          />
          A pet is in the house
        </label>
        {value.petsOnSite && (
          <div className="pl-6">
            <Textarea
              id={`${idPrefix}-pets`}
              label="What should visitors do? Optional"
              rows={2}
              value={value.petInstructions}
              placeholder="Biscuit is crated in the laundry room. Do not let him out."
              onChange={(e) => onChange({ ...value, petInstructions: e.target.value })}
            />
          </div>
        )}
      </div>

      {value.importantNote.trim() && (
        <SavedVisitorLine
          text={value.importantNote}
          hint="This was saved earlier. New rules belong in Visit guidelines below."
          onRemove={() => onChange({ ...value, importantNote: "" })}
        />
      )}
    </div>
  );
}

/** An old note that still shows to visitors, with a way to take it off. */
function SavedVisitorLine({
  text,
  hint,
  onRemove,
}: {
  text: string;
  hint?: string;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-xl bg-white/80 px-3 py-2.5 ring-1 ring-inset ring-amber-200">
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 text-[13px] leading-relaxed text-ink-800">{text}</p>
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 text-[13px] font-semibold text-ink-600 hover:text-ink-950"
        >
          Remove
        </button>
      </div>
      {hint && <p className="mt-1 text-[12px] leading-relaxed text-ink-500">{hint}</p>}
    </div>
  );
}

/** The bright box a visiting agent should see before they walk in. */
export function VisitorAlertsBanner({
  showings,
  heading = "Read this before you arrive",
}: {
  showings?: Partial<ShowingsWork>;
  heading?: string;
}) {
  const lines = visitorAlertLines(alertsFromShowings(showings));
  if (lines.length === 0) return null;
  return (
    <div className="rounded-2xl border-2 border-amber-400 bg-amber-50 px-4 py-3.5">
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden />
        <div className="min-w-0">
          <p className="text-[14px] font-semibold text-amber-950">{heading}</p>
          <ul className="mt-2 space-y-2">
            {lines.map((line) => (
              <li key={line.id}>
                <p className="text-[14px] font-semibold text-amber-950">{line.title}</p>
                <p className="text-[14px] leading-relaxed text-amber-900">{line.detail}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/** Bright warnings first, then the quieter guidelines. */
export function VisitVisitorNotes({
  showings,
  className = "",
}: {
  showings?: Partial<ShowingsWork>;
  className?: string;
}) {
  if (!showings) return null;
  const alerts = alertsFromShowings(showings);
  const lines = visitorAlertLines(alerts);
  const rules = routineGuidelines(showings, alerts);
  if (lines.length === 0 && rules.length === 0) return null;
  return (
    <div className={`space-y-2 ${className}`}>
      <VisitorAlertsBanner showings={showings} />
      {rules.length > 0 && (
        <div className="rounded-xl border border-hairline bg-surface px-3 py-3">
          <p className="text-[13px] font-semibold text-ink-800">
            {lines.length > 0 ? "Other visit guidelines" : "Visit guidelines"}
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-[14px] leading-relaxed text-ink-700">
            {rules.map((rule) => (
              <li key={rule.id}>{rule.text}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
