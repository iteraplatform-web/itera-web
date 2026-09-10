"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
import { IteraLogo } from "@/components/marketing/logo";
import { Avatar } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { NotificationsPanel } from "@/components/dashboard/notifications-panel";
import { FileSectionNav } from "@/components/workspace/workspace-sidebar";
import { useAuthStore, useNotificationsStore } from "@/stores";
import { cn } from "@/lib/utils/cn";
import type { TransactionFile, WorkspaceSection } from "@/types";

export interface Crumb {
  label: string;
  href?: string;
}

const MAIN_NAV = [
  { href: "/dashboard", label: "Home", icon: Home, match: (p: string) => p === "/dashboard" },
  { href: "/import", label: "Import Spreadsheet", icon: FileSpreadsheet, match: (p: string) => p.startsWith("/import") },
  { href: "/settings", label: "Settings", icon: Settings, match: (p: string) => p.startsWith("/settings") },
];

/**
 * The frame every signed-in page sits in. One sidebar that never moves:
 * where you are, where you can go, and — inside a file — every part of that
 * file, so nothing has to be hunted for.
 */
export function AppShell({
  children,
  crumbs,
  file,
  activeSection,
}: {
  children: React.ReactNode;
  crumbs?: Crumb[];
  /** When set, the sidebar shows this file and its sections. */
  file?: TransactionFile;
  activeSection?: WorkspaceSection;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();

  // Close the mobile drawer whenever the page changes.
  useEffect(() => setDrawerOpen(false), [pathname]);

  const sidebar = (
    <SidebarContent file={file} activeSection={activeSection} onNavigate={() => setDrawerOpen(false)} />
  );

  return (
    <AuthGuard>
      <div className="min-h-screen bg-canvas">
        {/* Fixed sidebar from lg up */}
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-[284px] flex-col border-r border-hairline bg-surface lg:flex">
          {sidebar}
        </aside>

        {/* Drawer below lg */}
        {drawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 animate-fade-in bg-ink-950/40" onClick={() => setDrawerOpen(false)} />
            <aside className="absolute inset-y-0 left-0 flex w-[300px] max-w-[85vw] animate-slide-in flex-col bg-surface shadow-xl">
              <button
                onClick={() => setDrawerOpen(false)}
                className="absolute right-3 top-4 rounded-lg p-2 text-ink-500 hover:bg-ink-100"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
              {sidebar}
            </aside>
          </div>
        )}

        <div className="lg:pl-[284px]">
          <TopBar crumbs={crumbs} onOpenMenu={() => setDrawerOpen(true)} />
          <main className="px-4 pb-16 pt-6 sm:px-6 lg:px-10">{children}</main>
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

  return (
    <>
      <div className="flex h-[68px] shrink-0 items-center px-5">
        <Link href="/dashboard" onClick={onNavigate}>
          <IteraLogo />
        </Link>
      </div>

      {file && activeSection ? (
        /* ── Inside a file: only this file, plus one clear way out ── */
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          <Link href="/dashboard" onClick={onNavigate} className="block">
            <Button variant="secondary" className="w-full justify-start">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>

          <div className="mt-4 rounded-2xl bg-ink-950 p-4 text-white">
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-300">
              {file.side === "listing" ? "Listing workspace" : "Buyer workspace"}
            </p>
            <p className="mt-1.5 line-clamp-2 text-[16px] font-semibold leading-snug">
              {file.propertyAddress || file.clientName}
            </p>
            <p className="mt-0.5 truncate text-[14px] text-ink-300">{file.clientName}</p>
            <StatusBadge status={file.status} size="sm" className="mt-2.5" />
          </div>

          <div className="mt-5">
            <FileSectionNav file={file} active={activeSection} onNavigate={onNavigate} />
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          {/* The two ways to start work, always in the same place */}
          <div className="grid grid-cols-[1fr_auto] gap-2 px-1">
            <Link href="/files/new?full=true" onClick={onNavigate}>
              <Button className="w-full">
                <Plus className="h-4 w-4" />
                New file
              </Button>
            </Link>
            <Link href="/files/new" onClick={onNavigate} title="Quick lead — just a name and number">
              <Button variant="secondary" aria-label="Quick lead">
                <Zap className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <nav className="mt-5 space-y-0.5">
            {MAIN_NAV.map((item) => {
              const active = item.match(pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-[42px] items-center gap-3 rounded-xl px-3 py-2 text-[15px] font-medium transition-colors",
                    active ? "bg-ink-950 text-white shadow-sm" : "text-ink-700 hover:bg-ink-100/70 hover:text-ink-950"
                  )}
                >
                  <item.icon className={cn("h-[18px] w-[18px]", active ? "text-white" : "text-ink-500")} />
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/client"
              target="_blank"
              className="flex min-h-[42px] items-center gap-3 rounded-xl px-3 py-2 text-[15px] font-medium text-ink-700 transition-colors hover:bg-ink-100/70 hover:text-ink-950"
            >
              <Eye className="h-[18px] w-[18px] text-ink-500" />
              Client Portal
              <span className="ml-auto text-[12px] text-ink-400">New tab</span>
            </Link>
          </nav>
        </div>
      )}

      <div className="shrink-0 border-t border-hairline p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-1.5">
          <Avatar name={user?.name ?? "Agent"} size="md" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-semibold text-ink-950">{user?.name}</p>
            <p className="truncate text-[13px] text-ink-500">{user?.brokerage}</p>
          </div>
          <button
            onClick={() => {
              logout();
              router.push("/");
            }}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] font-medium text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-900"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </div>
    </>
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
    <header className="sticky top-0 z-30 border-b border-hairline bg-canvas/90 backdrop-blur-xl">
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
