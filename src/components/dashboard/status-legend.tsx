"use client";

import { DEADLINE_KEY, fileDeadline } from "@/lib/selectors/file-deadline";
import { cn } from "@/lib/utils/cn";
import type { TransactionFile } from "@/types";

/** What the coloured dots on the files mean: the closing or listing end date. */
export function StatusLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2" aria-label="Deadline colors">
      <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-ink-400">Deadline</span>
      <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        {DEADLINE_KEY.map((item) => (
          <li key={item.tone} className="group/tip relative inline-flex cursor-default items-center gap-1.5 text-[13px] text-ink-700">
            <span className={cn("h-2 w-2 shrink-0 rounded-full", item.solid)} aria-hidden />
            {item.label}
            <span
              role="tooltip"
              className="pointer-events-none absolute left-0 top-full z-30 mt-2 hidden w-64 rounded-lg bg-ink-950 px-3 py-2 text-left text-[12px] font-normal leading-snug text-white shadow-lg group-hover/tip:block"
            >
              {item.hint}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function deadlineCopy(file: TransactionFile) {
  const mark = fileDeadline(file);
  const theme = DEADLINE_KEY.find((item) => item.tone === mark.tone) ?? DEADLINE_KEY[3];
  const short = mark.tone === "none" ? "No date" : mark.detail;
  const long = mark.tone === "none" ? theme.hint : `${theme.hint} ${mark.detail}.`;
  return { theme, short, long };
}

/**
 * Small deadline dot in the top-right of the photo.
 * A white edge and a dark hairline keep the colour readable on sky, grass, brick, and pale walls.
 */
export function DeadlineDot({ file }: { file: TransactionFile }) {
  const { theme, short, long } = deadlineCopy(file);

  return (
    <span
      title={long}
      aria-label={short}
      className={cn(
        "absolute right-3 top-3.5 z-10 h-2.5 w-2.5 rounded-full shadow-[0_0_0_2px_#fff,0_0_0_3px_rgba(20,20,19,0.55)]",
        theme.solid
      )}
    />
  );
}

/** One dot plus the date it comes from, so the colour is never the only clue. */
export function DeadlineMark({ file, className }: { file: TransactionFile; className?: string }) {
  const { theme, short, long } = deadlineCopy(file);

  return (
    <p className={cn("group/tip relative flex min-w-0 items-center gap-1.5 text-[13px] text-ink-600", className)}>
      <span className={cn("h-2 w-2 shrink-0 rounded-full", theme.solid)} aria-hidden />
      <span className="truncate">{short}</span>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-0 top-full z-30 mt-1.5 hidden w-64 rounded-lg bg-ink-950 px-3 py-2 text-left text-[12px] font-normal leading-snug text-white shadow-lg group-hover/tip:block"
      >
        {long}
      </span>
    </p>
  );
}
