"use client";

import Link from "next/link";
import { ArrowRight, Home, Search } from "lucide-react";
import { useTransactionsStore } from "@/stores";
import { useHasHydrated } from "@/hooks/use-hydrated";
import { StatusBadge } from "@/components/ui/status-badge";
import { IteraLogo, IteraMark } from "@/components/marketing/logo";
import { getClientTimelineState } from "@/lib/checklist/engine";
import { EmptyState } from "@/components/ui/misc";
import { cn } from "@/lib/utils/cn";

export default function ClientLandingPage() {
  const files = useTransactionsStore((s) => s.files);
  const hydrated = useHasHydrated();

  // Wait for persisted state before deciding there is nothing to show.
  if (!hydrated || files.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas">
        <IteraMark className="h-9 w-9 animate-pulse" />
        <p className="text-[14px] text-ink-500">Loading…</p>
      </div>
    );
  }

  const activeFiles = files.filter(
    (f) => !["dropped", "terminated"].includes(f.status)
  );

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-hairline bg-surface">
        <div className="mx-auto flex max-w-md items-center justify-between px-5 py-4">
          <IteraLogo />
          <Link
            href="/"
            className="text-[13px] font-medium text-ink-500 transition-colors hover:text-ink-700"
          >
            Agent side →
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-7">
        <div className="px-1">
          <h1 className="text-[22px] font-bold leading-tight tracking-[-0.025em] text-ink-950">
            Your transactions
          </h1>
          <p className="mt-1.5 text-[14px] leading-relaxed text-ink-500">
            Pick one to see where it stands and what, if anything, is needed from you.
          </p>
        </div>

        <div className="stagger mt-5 space-y-3">
          {activeFiles.length === 0 ? (
            <EmptyState
              icon={Home}
              title="No active transactions"
              description="Your agent will share one with you when it opens."
            />
          ) : (
            activeFiles.map((file) => {
              const timeline = getClientTimelineState(file.status);
              const done = timeline.filter((s) => s.state === "done").length;
              const currentIndex = timeline.findIndex((s) => s.state === "current");

              return (
                <Link
                  key={file.id}
                  href={`/client/${file.id}`}
                  className="group block rounded-2xl border border-hairline bg-surface p-4 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 text-[13px] font-medium text-ink-500">
                        {file.side === "listing" ? (
                          <Home className="h-3 w-3" />
                        ) : (
                          <Search className="h-3 w-3" />
                        )}
                        {file.side === "listing" ? "Selling" : "Buying"}
                      </p>
                      <p className="mt-1 text-[15px] font-semibold leading-snug text-ink-950">
                        {file.propertyAddress}
                      </p>
                    </div>
                    <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-ink-400 transition-transform group-hover:translate-x-0.5 group-hover:text-ink-600" />
                  </div>

                  {/* Four-step progress, as segments */}
                  <div className="mt-3.5 flex gap-1">
                    {timeline.map((step) => (
                      <span
                        key={step.key}
                        className={cn(
                          "h-1.5 flex-1 rounded-full",
                          step.state === "done"
                            ? "bg-emerald-500"
                            : step.state === "current"
                            ? "bg-itera-500"
                            : "bg-ink-100"
                        )}
                      />
                    ))}
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <StatusBadge status={file.status} size="sm" />
                    {/* Deliberately not the status label again — this says how far
                        along the four client-visible stages the file sits. */}
                    <span className="text-[13px] text-ink-500">
                      {done === timeline.length
                        ? "All stages complete"
                        : currentIndex >= 0
                        ? `Stage ${currentIndex + 1} of ${timeline.length}`
                        : "Getting started"}
                    </span>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
