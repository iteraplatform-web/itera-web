"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface BuildStep {
  label: string;
  detail: string;
}

/**
 * Shown between submitting the intake and landing in the new file. Each step
 * names what was actually produced for this file — the real task count, the
 * real conditional tasks — so the pause explains the result rather than
 * just delaying it.
 */
export function BuildProgress({ steps, onDone }: { steps: BuildStep[]; onDone: () => void }) {
  const [current, setCurrent] = useState(0);
  // Completion creates the file — it must run exactly once, even if the parent
  // re-renders (a toast, a store update) while the last step is on screen.
  const fired = useRef(false);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    if (current >= steps.length) {
      const t = setTimeout(() => {
        if (fired.current) return;
        fired.current = true;
        doneRef.current();
      }, 450);
      return () => clearTimeout(t);
    }
    // Slightly uneven pacing reads as work, not an animation loop.
    const t = setTimeout(() => setCurrent((c) => c + 1), 380 + (current % 2) * 160);
    return () => clearTimeout(t);
  }, [current, steps.length]);

  const pct = Math.round((Math.min(current, steps.length) / steps.length) * 100);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-ink-950/50 p-4 backdrop-blur-[3px] animate-fade-in">
      <div className="w-full max-w-md rounded-2xl bg-surface p-7 shadow-xl animate-rise" role="status" aria-live="polite">
        <p className="text-[20px] font-bold tracking-[-0.02em] text-ink-950">Building your checklist</p>
        <p className="mt-1 text-[15px] text-ink-500">This only takes a moment.</p>

        <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-ink-100">
          <div className="h-full rounded-full bg-itera-600 transition-[width] duration-300 ease-out" style={{ width: `${pct}%` }} />
        </div>

        <ol className="mt-6 space-y-3.5">
          {steps.map((step, i) => {
            const done = i < current;
            const active = i === current;
            return (
              <li key={step.label} className="flex items-start gap-3">
                <span
                  className={cn(
                    "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                    done ? "bg-emerald-500 text-white" : active ? "bg-itera-50 text-itera-600" : "bg-ink-100 text-ink-400"
                  )}
                >
                  {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : active ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                </span>
                <div className={cn("min-w-0", !done && !active && "opacity-50")}>
                  <p className="text-[15px] font-semibold text-ink-900">{step.label}</p>
                  {(done || active) && <p className="text-[14px] text-ink-500">{step.detail}</p>}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
