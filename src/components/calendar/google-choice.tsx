"use client";

import { CalendarPlus } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/** A clear yes/no for copying a reminder into Google Calendar. */
export function GoogleCalendarChoice({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      className={cn(
        "flex w-full items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors",
        checked ? "border-itera-300 bg-itera-50" : "border-hairline bg-canvas hover:border-hairline-strong"
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md",
          checked ? "bg-itera-600 text-white" : "bg-surface ring-1 ring-inset ring-ink-300"
        )}
      >
        {checked && (
          <svg viewBox="0 0 12 12" className="h-3 w-3" aria-hidden>
            <path d="M2 6.2 4.6 9 10 3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-1.5 text-[14px] font-semibold text-ink-950">
          <CalendarPlus className="h-3.5 w-3.5 text-itera-600" />
          Also add to Google Calendar
        </span>
        <span className="mt-0.5 block text-[13px] leading-snug text-ink-500">
          Google opens with this reminder filled in. It is saved there only after you press Save.
        </span>
      </span>
    </button>
  );
}
