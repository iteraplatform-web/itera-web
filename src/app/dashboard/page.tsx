"use client";

import { format } from "date-fns";
import { useMemo } from "react";
import Link from "next/link";
import {
  Calendar,
  Columns3,
  LayoutGrid,
  Plus,
  Search,
  SlidersHorizontal,
  X,
  Zap,
} from "lucide-react";
import { AuthGuard } from "@/components/layout/auth-guard";
import { AppShell } from "@/components/layout/app-shell";
import { HomeSummary } from "@/components/dashboard/home-summary";
import { FileCard } from "@/components/dashboard/file-card";
import { KanbanBoard } from "@/components/dashboard/kanban-board";
import { CalendarView } from "@/components/dashboard/calendar-view";
import { PortfolioStatsRow } from "@/components/dashboard/portfolio-stats-row";
import { PipelineBar } from "@/components/dashboard/pipeline-bar";
import { Button } from "@/components/ui/button";
import { Segmented, EmptyState } from "@/components/ui/misc";
import { useTransactionsStore, useAuthStore } from "@/stores";
import { filterFiles, getPortfolioStats } from "@/lib/selectors/transactions";
import { ensureWorkFields } from "@/lib/work/defaults";
import { STATUS_LABELS, type TransactionStatus } from "@/types";

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}

function DashboardContent() {

  const user = useAuthStore((s) => s.user);
  const allFiles = useTransactionsStore((s) => s.files);
  const normalizedFiles = useMemo(() => allFiles.map(ensureWorkFields), [allFiles]);
  const dashboardView = useTransactionsStore((s) => s.dashboardView);
  const setDashboardView = useTransactionsStore((s) => s.setDashboardView);
  const statusFilter = useTransactionsStore((s) => s.statusFilter);
  const setStatusFilter = useTransactionsStore((s) => s.setStatusFilter);
  const sideFilter = useTransactionsStore((s) => s.sideFilter);
  const setSideFilter = useTransactionsStore((s) => s.setSideFilter);
  const searchQuery = useTransactionsStore((s) => s.searchQuery);
  const setSearchQuery = useTransactionsStore((s) => s.setSearchQuery);

  const stats = useMemo(() => getPortfolioStats(normalizedFiles), [normalizedFiles]);
  const files = useMemo(
    () => filterFiles(normalizedFiles, statusFilter, sideFilter, searchQuery),
    [normalizedFiles, statusFilter, sideFilter, searchQuery]
  );

  const filtersActive = statusFilter !== "all" || sideFilter !== "all" || searchQuery !== "";

  const clearFilters = () => {
    setStatusFilter("all");
    setSideFilter("all");
    setSearchQuery("");
  };

  return (
    <AppShell crumbs={[{ label: "Home" }]}>
      <div className="mx-auto max-w-[1600px] space-y-5">
        {/* ── Heading ── the sidebar says hello, so this names the page */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-serif text-[34px] font-medium leading-tight tracking-[-0.01em] text-ink-950">Your files</h1>
            <p className="mt-0.5 text-[15px] text-ink-500">{format(new Date(), "EEEE, MMMM d")}</p>
          </div>
        </div>

        <HomeSummary files={normalizedFiles} stats={stats} />

        {/* Activity sits beside the files only on very wide screens; on a laptop
            the files get the full width and activity follows below. */}
        <div>
          <div className="min-w-0 space-y-4">
            {/* ── Find a file ─────────────────────────────────────── */}
            <div className="rounded-2xl border border-hairline bg-surface p-3 shadow-sm">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative min-w-[260px] flex-1">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                  <input
                    type="text"
                    placeholder="Search by client name or address…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-label="Search files"
                    className="w-full rounded-xl border-0 bg-canvas py-2.5 pl-10 pr-9 text-[15px] text-ink-950 ring-1 ring-inset ring-transparent transition-shadow placeholder:text-ink-400 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-itera-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-ink-400 hover:bg-ink-100 hover:text-ink-600"
                      aria-label="Clear search"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as TransactionStatus | "all")}
                    aria-label="Status"
                    className="h-10 cursor-pointer rounded-xl border-0 bg-canvas px-3 text-[15px] font-medium text-ink-700 focus:outline-none focus:ring-2 focus:ring-itera-500"
                  >
                    <option value="all">All statuses</option>
                    {Object.entries(STATUS_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={sideFilter}
                    onChange={(e) => setSideFilter(e.target.value as "all" | "listing" | "buying")}
                    aria-label="Listings or buyers"
                    className="h-10 cursor-pointer rounded-xl border-0 bg-canvas px-3 text-[14px] font-medium text-ink-700 focus:outline-none focus:ring-2 focus:ring-itera-500"
                  >
                    <option value="all">Listings and buyers</option>
                    <option value="listing">Listings only</option>
                    <option value="buying">Buyers only</option>
                  </select>
                  {filtersActive && (
                    <Button size="sm" variant="ghost" onClick={clearFilters}>
                      <X className="h-3.5 w-3.5" />
                      Clear
                    </Button>
                  )}
                  <Segmented
                    value={dashboardView}
                    onChange={setDashboardView}
                    options={[
                      { value: "cards", label: "Cards", icon: LayoutGrid },
                      { value: "kanban", label: "Board", icon: Columns3 },
                      { value: "calendar", label: "Calendar", icon: Calendar },
                    ]}
                  />
                </div>
              </div>
            </div>

            {filtersActive && (
              <p className="text-[14px] text-ink-500">
                Showing <span className="tnum font-semibold text-ink-700">{files.length}</span> of{" "}
                <span className="tnum">{allFiles.length}</span> files
              </p>
            )}

            {/* ── The files ───────────────────────────────────────── */}
            {dashboardView === "cards" &&
              (files.length > 0 ? (
                <div className="stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {files.map((file) => (
                    <FileCard key={file.id} file={file} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={SlidersHorizontal}
                  title="No files match these filters"
                  description="Try a different status or side, or clear the search."
                  action={
                    <Button size="sm" variant="secondary" onClick={clearFilters}>
                      Clear filters
                    </Button>
                  }
                />
              ))}
            {dashboardView === "kanban" && <KanbanBoard files={files} />}
            {dashboardView === "calendar" && <CalendarView files={files} />}

          </div>
        </div>
      </div>
    </AppShell>
  );
}
