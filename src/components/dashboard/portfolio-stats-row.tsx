"use client";

import { AlertCircle, CalendarCheck, FolderOpen, TrendingUp } from "lucide-react";
import type { PortfolioStats } from "@/types";
import { cn } from "@/lib/utils/cn";

interface PortfolioStatsRowProps {
  stats: PortfolioStats;
  pipelineValue: number;
}

function formatPipeline(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${value}`;
}

export function PortfolioStatsRow({ stats, pipelineValue }: PortfolioStatsRowProps) {
  const cards = [
    {
      label: "Open files",
      value: String(stats.openFiles),
      sub: "Active in the pipeline",
      icon: FolderOpen,
      tone: "text-itera-600",
    },
    {
      label: "Closing this month",
      value: String(stats.closingsThisMonth),
      sub: "Scheduled to complete",
      icon: CalendarCheck,
      tone: "text-emerald-600",
    },
    {
      label: "Overdue",
      value: String(stats.overdueCount),
      sub: stats.overdueCount > 0 ? "Needs attention now" : "Everything on track",
      icon: AlertCircle,
      tone: stats.overdueCount > 0 ? "text-red-600" : "text-ink-500",
      alert: stats.overdueCount > 0,
    },
    {
      label: "Pipeline value",
      value: formatPipeline(pipelineValue),
      sub: "Active transaction volume",
      icon: TrendingUp,
      tone: "text-ink-700",
    },
  ];

  return (
    <div className="stagger grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline shadow-sm sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={cn(
            "relative bg-surface px-5 py-4 transition-colors",
            card.alert && "bg-red-50/50"
          )}
        >
          <div className="flex items-center justify-between">
            <p className="section-title">{card.label}</p>
            <card.icon className={cn("h-4 w-4", card.tone)} />
          </div>
          <p className="tnum mt-2.5 text-[28px] font-bold leading-none tracking-[-0.03em] text-ink-950">
            {card.value}
          </p>
          <p
            className={cn(
              "mt-1.5 text-[13px]",
              card.alert ? "font-medium text-red-600" : "text-ink-500"
            )}
          >
            {card.sub}
          </p>
        </div>
      ))}
    </div>
  );
}
