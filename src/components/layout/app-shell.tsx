"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import {
  ArrowLeft,
  Bell,
  ChevronRight,
  Eye,
  FileSpreadsheet,
  Home,
  LogOut,
  Menu,
  Plus,
  Settings,
  X,
  Zap,
} from "lucide-react";
import { AuthGuard } from "@/components/layout/auth-guard";
import { TopoPattern } from "@/components/layout/topo-pattern";
import { IteraLogo } from "@/components/marketing/logo";
import { NotificationsPanel } from "@/components/dashboard/notifications-panel";
import { FileSectionNav } from "@/components/workspace/workspace-sidebar";
import { useAuthStore, useNotificationsStore, useTransactionsStore } from "@/stores";
import { getPortfolioStats } from "@/lib/selectors/transactions";
import { getTotalPipelineValue } from "@/lib/selectors/file-metrics";
import { calculatePayout, money } from "@/lib/work/payout";
import { STATUS_THEME } from "@/lib/utils/status-theme";
import { cn } from "@/lib/utils/cn";
import { STATUS_LABELS, type TransactionFile, type WorkspaceSection } from "@/types";

export interface Crumb {
  label: string;
  href?: string;
}

const MAIN_NAV = [
  { href: "/dashboard", label: "Home", icon: Home, match: (p: string) => p === "/dashboard" },
  { href: "/import", label: "Import Spreadsheet", icon: FileSpreadsheet, match: (p: string) => p.startsWith("/import") },
  { href: "/settings", label: "Settings", icon: Settings, match: (p: string) => p.startsWith("/settings") },
];

/** Shared look for every sidebar link, so main and file navigation match. */
export const sidebarLink = (active: boolean) =>
  cn(
    "flex min-h-[46px] items-center gap-3 rounded-xl px-3.5 py-2.5 text-[16px] transition-colors",
    active ? "bg-cream-200/80 font-semibold text-cream-ink" : "font-medium text-cream-ink/80 hover:bg-cream-200/45 hover:text-cream-ink"
  );

/**
 * The frame every signed-in page sits in: a warm sidebar that never moves,
 * and the work itself on a clean white panel beside it.
 */
export function AppShell({
  children,
  crumbs,
  file,
  activeSection,
}: {
  children: React.ReactNode;
  crumbs?: Crumb[];
  file?: TransactionFile;
  activeSection?: WorkspaceSection;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setDrawerOpen(false), [pathname]);

  const sidebar = <SidebarContent file={file} activeSection={activeSection} onNavigate={() => setDrawerOpen(false)} />;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-b from-cream-100 to-cream-50">
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-[288px] flex-col lg:flex">{sidebar}</aside>

        {drawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 animate-fade-in bg-ink-950/40" onClick={() => setDrawerOpen(false)} />
            <aside className="absolute inset-y-0 left-0 flex w-[300px] max-w-[85vw] animate-slide-in flex-col bg-gradient-to-b from-cream-100 to-cream-50 shadow-xl">
              <button
                onClick={() => setDrawerOpen(false)}
                className="absolute right-3 top-4 z-10 rounded-lg p-2 text-cream-ink/70 hover:bg-cream-200"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
              {sidebar}
            </aside>
          </div>
        )}

        {/* The work sits on a white panel, lifted off the cream */}
        <div className="lg:py-3 lg:pl-[288px] lg:pr-3">
          <div className="min-h-screen bg-canvas lg:min-h-[calc(100vh-24px)] lg:rounded-[28px] lg:shadow-[0_1px_3px_rgba(20,20,19,0.08),0_12px_32px_-12px_rgba(20,20,19,0.14)] lg:ring-1 lg:ring-cream-300/60">
            <TopBar crumbs={crumbs} onOpenMenu={() => setDrawerOpen(true)} />
            <main className="px-4 pb-16 pt-6 sm:px-6 lg:px-10">{children}</main>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}

function SidebarContent({
  file,
  activeSection,
  onNavigate,
}: {
  file?: TransactionFile;
  activeSection?: WorkspaceSection;
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const files = useTransactionsStore((s) => s.files);
  const firstName = user?.name?.split(" ")[0] ?? "there";
  const inFile = Boolean(file && activeSection);

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      <TopoPattern className="pointer-events-none absolute inset-x-0 top-0 h-[340px] w-full text-cream-300" />

      <div className="relative flex-1 overflow-y-auto px-5 pb-4 pt-7">
        <Link href="/dashboard" onClick={onNavigate} className="inline-flex">
          <IteraLogo wordClassName="text-cream-ink" />
        </Link>

        {inFile && file ? (
          <>
            <Link
              href="/dashboard"
              onClick={onNavigate}
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-white/70 px-3.5 py-2 text-[15px] font-semibold text-cream-ink shadow-sm ring-1 ring-cream-300/70 hover:bg-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>

            <h2 className="mt-5 font-serif text-[27px] font-medium leading-[1.15] tracking-[-0.01em] text-cream-ink">
              {(file.propertyAddress || file.clientName).split(",")[0]}
            </h2>
            <p className="mt-1.5 text-[15px] leading-relaxed text-cream-ink/70">
              {file.clientName}
              <br />
              {file.side === "listing" ? "Listing" : "Buyer"} ·{" "}
              <span className={cn("font-semibold", STATUS_THEME[file.status].text)}>{STATUS_LABELS[file.status]}</span>
            </p>

            <div className="mt-6">
              <FileSectionNav file={file} active={activeSection!} onNavigate={onNavigate} />
            </div>
          </>
        ) : (
          <>
            <h2 className="mt-7 font-serif text-[30px] font-medium leading-[1.12] tracking-[-0.01em] text-cream-ink">
              Welcome back,
              <br />
              <span className="font-semibold">{firstName}!</span>
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-cream-ink/70">
              {user?.brokerage ?? "Your brokerage"}
              {user?.markets?.length ? (
                <>
                  <br />
                  Serving <span className="font-medium text-cream-ink">{user.markets.slice(0, 2).join(" & ")}</span>
                </>
              ) : null}
            </p>

            <div className="mt-6 grid grid-cols-[1fr_auto] gap-2">
              <Link
                href="/files/new?full=true"
                onClick={onNavigate}
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-cream-ink text-[15px] font-semibold text-cream-50 shadow-sm hover:bg-ink-900"
              >
                <Plus className="h-4 w-4" />
                New file
              </Link>
              <Link
                href="/files/new"
                onClick={onNavigate}
                title="Quick lead — just a name and number"
                aria-label="Quick lead"
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/70 text-cream-ink ring-1 ring-cream-300/70 hover:bg-white"
              >
                <Zap className="h-4 w-4" />
              </Link>
            </div>

            <nav className="mt-6 space-y-1" aria-label="Main">
              {MAIN_NAV.map((item) => {
                const active = item.match(pathname);
                return (
                  <Link key={item.href} href={item.href} onClick={onNavigate} aria-current={active ? "page" : undefined} className={sidebarLink(active)}>
                    <item.icon className="h-5 w-5 shrink-0" strokeWidth={1.75} />
                    {item.label}
                  </Link>
                );
              })}
              <Link href="/client/login" target="_blank" className={sidebarLink(false)}>
                <Eye className="h-5 w-5 shrink-0" strokeWidth={1.75} />
                Client Portal
                <span className="ml-auto text-[13px] text-cream-ink/50">New tab</span>
              </Link>
            </nav>
          </>
        )}
      </div>

      {/* ── Figures at the foot, like a statement ─────────────── */}
      <div className="relative shrink-0 px-5 pb-4">
        {inFile && file ? <FileFigures file={file} /> : <PortfolioFigures files={files} />}

        <div className="mt-4 flex items-center justify-between border-t border-cream-300/70 pt-3">
          <span className="truncate text-[14px] font-medium text-cream-ink/80">{user?.name}</span>
          <button
            onClick={() => {
              logout();
              router.push("/");
            }}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[14px] font-medium text-cream-ink/70 hover:bg-cream-200/60 hover:text-cream-ink"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between border-t border-cream-300/70 py-2.5">
      <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-cream-ink/60">{label}</span>
      <span className="tnum font-serif text-[20px] font-medium text-cream-ink">{value}</span>
    </div>
  );
}

function Headline({ label, value }: { label: string; value: string }) {
  return (
    <div className="pb-3">
      <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-cream-ink/60">{label}</p>
      <p className="tnum mt-1 font-serif text-[34px] font-medium leading-none tracking-[-0.01em] text-cream-ink">{value}</p>
    </div>
  );
}

function compact(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${Math.round(n)}`;
}

function PortfolioFigures({ files }: { files: TransactionFile[] }) {
  const stats = useMemo(() => getPortfolioStats(files), [files]);
  const pipeline = useMemo(() => getTotalPipelineValue(files), [files]);
  return (
    <div>
      <Headline label="Active pipeline" value={compact(pipeline)} />
      <Figure label="Open files" value={String(stats.openFiles)} />
      <Figure label="Closing this month" value={String(stats.closingsThisMonth)} />
    </div>
  );
}

function FileFigures({ file }: { file: TransactionFile }) {
  const user = useAuthStore((s) => s.user);
  const payout = calculatePayout(file, user);
  const done = file.checklist.filter((t) => t.status === "completed").length;
  return (
    <div>
      <Headline label="Your expected take-home" value={money(payout.net)} />
      <Figure label="Closing" value={file.closingDate ? format(parseISO(file.closingDate), "MMM d") : "Not set"} />
      <Figure label="Checklist" value={`${done} of ${file.checklist.length}`} />
    </div>
  );
}

function TopBar({ crumbs, onOpenMenu }: { crumbs?: Crumb[]; onOpenMenu: () => void }) {
  const unreadCount = useNotificationsStore((s) => s.notifications.filter((n) => !n.read).length);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <header className="sticky top-0 z-30 border-b border-hairline bg-canvas/90 backdrop-blur-xl lg:rounded-t-[28px]">
      <div className="flex h-[68px] items-center gap-3 px-4 sm:px-6 lg:px-10">
        <button
          onClick={onOpenMenu}
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-[14px] font-semibold text-ink-800 ring-1 ring-inset ring-hairline-strong lg:hidden"
        >
          <Menu className="h-5 w-5" />
          Menu
        </button>

        {crumbs && crumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 text-[14px] sm:flex">
            {crumbs.map((c, i) => (
              <span key={i} className="flex min-w-0 items-center gap-1.5">
                {i > 0 && <ChevronRight className="h-4 w-4 shrink-0 text-ink-400" />}
                {c.href ? (
                  <Link href={c.href} className="truncate font-medium text-ink-500 hover:text-ink-900">
                    {c.label}
                  </Link>
                ) : (
                  <span className="truncate font-semibold text-ink-900">{c.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}

        <div className="ml-auto flex items-center gap-2">
          <div className="relative" ref={ref}>
            <button
              onClick={() => setOpen((v) => !v)}
              className={cn(
                "relative flex h-10 items-center gap-2 rounded-xl px-3 text-[14px] font-semibold transition-colors",
                open ? "bg-ink-100 text-ink-950" : "text-ink-700 hover:bg-ink-100"
              )}
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="hidden sm:inline">Notifications</span>
              {unreadCount > 0 && (
                <span className="tnum flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[12px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>
            {open && <NotificationsPanel onClose={() => setOpen(false)} />}
          </div>
        </div>
      </div>
    </header>
  );
}
