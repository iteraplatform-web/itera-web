"use client";

import { ClipboardList, Home, LineChart, Percent } from "lucide-react";
import type { PortfolioWorkStats } from "@/types";
import { cn } from "@/lib/utils/cn";

export function PortfolioWorkStrip({ stats }: { stats: PortfolioWorkStats }) {
  const cards = [
    {
      label: "Avg days on market",
      value: stats.avgDaysOnMarket !== null ? String(stats.avgDaysOnMarket) : "—",
      sub: "Active & recent listings",
      icon: LineChart,
    },
    {
      label: "Showings logged",
      value: String(stats.totalShowings),
      sub:
        stats.showingsToOfferRate !== null
          ? `${stats.showingsToOfferRate}% of shown files have offers`
          : "Across open files",
      icon: ClipboardList,
    },
    {
      label: "Missing CMA",
      value: String(stats.filesMissingCma),
      sub: "Listing files without pricing work",
      icon: Home,
      alert: stats.filesMissingCma > 0,
    },
    {
      label: "Showings → offer",
      value: stats.showingsToOfferRate !== null ? `${stats.showingsToOfferRate}%` : "—",
      sub: "Files with showings that also have offers",
      icon: Percent,
    },
  ];

  return (
    <div className="rounded-2xl border border-hairline bg-surface p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[14px] font-semibold text-ink-900">Listing work analytics</p>
          <p className="text-[13px] text-ink-500">
            Derived from CMA, showings, offers, and listing sheets on file
          </p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className={cn(
              "rounded-xl border border-hairline px-3.5 py-3",
              card.alert && "border-amber-200 bg-amber-50/40"
            )}
          >
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-semibold uppercase tracking-wide text-ink-500">
                {card.label}
              </p>
              <card.icon className="h-3.5 w-3.5 text-ink-500" />
            </div>
            <p className="tnum mt-1.5 text-[22px] font-bold tracking-[-0.02em] text-ink-950">
              {card.value}
            </p>
            <p className="mt-1 text-[13px] text-ink-500">{card.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
