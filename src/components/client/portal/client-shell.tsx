"use client";

import Link from "next/link";
import {
  CircleHelp,
  FileText,
  Home,
  Images,
  MessageSquare,
  Route,
  Search,
  Wallet,
} from "lucide-react";
import { IteraLogo } from "@/components/marketing/logo";
import { Avatar } from "@/components/ui/misc";
import { StatusBadge } from "@/components/ui/status-badge";
import { useAuthStore } from "@/stores";
import { cn } from "@/lib/utils/cn";
import type { TransactionFile } from "@/types";

export type ClientTab = "home" | "progress" | "documents" | "messages" | "property" | "money" | "help";

export const CLIENT_TABS: ClientTab[] = ["home", "progress", "documents", "messages", "property", "money", "help"];

export function clientTabHref(fileId: string, tab: ClientTab) {
  return tab === "home" ? `/client/${fileId}` : `/client/${fileId}?tab=${tab}`;
}

export function tabMeta(file: TransactionFile): Record<ClientTab, { label: string; icon: React.ElementType }> {
  return {
    home: { label: "Home", icon: Home },
    progress: { label: "Progress", icon: Route },
    documents: { label: "Documents", icon: FileText },
    messages: { label: "Messages", icon: MessageSquare },
    property: file.side === "listing" ? { label: "Your Home", icon: Images } : { label: "Your Search", icon: Search },
    money: { label: "Money", icon: Wallet },
    help: { label: "Help", icon: CircleHelp },
  };
}

/**
 * The client's own space. Deliberately calmer than the agent side: one
 * property, seven plain-language sections, and the agent always one tap away.
 */
export function ClientShell({
  file,
  tab,
  badges,
  children,
}: {
  file: TransactionFile;
  tab: ClientTab;
  badges: Partial<Record<ClientTab, number>>;
  children: React.ReactNode;
}) {
  const agent = useAuthStore((s) => s.user);
  const meta = tabMeta(file);
  const agentName = agent?.name ?? "Your agent";

  const NavLink = ({ t, compact }: { t: ClientTab; compact?: boolean }) => {
    const Icon = meta[t].icon;
    const active = t === tab;
    const badge = badges[t];
    return (
      <Link
        href={clientTabHref(file.id, t)}
        aria-current={active ? "page" : undefined}
        className={cn(
          compact
            ? "flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2.5 text-[15px] font-semibold"
            : "flex min-h-[46px] items-center gap-3 rounded-xl px-3.5 py-2.5 text-[16px] font-medium",
          active
            ? "bg-itera-600 text-white shadow-sm"
            : compact
            ? "bg-surface text-ink-700 ring-1 ring-inset ring-hairline"
            : "text-ink-700 hover:bg-ink-100/70 hover:text-ink-950"
        )}
      >
        <Icon className={cn("h-5 w-5 shrink-0", active ? "text-white" : "text-ink-500")} />
        <span className="flex-1">{meta[t].label}</span>
        {badge ? (
          <span className={cn("tnum rounded-full px-2 py-0.5 text-[12px] font-bold", active ? "bg-white/20 text-white" : "bg-red-500 text-white")}>
            {badge}
          </span>
        ) : null}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-canvas">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[272px] flex-col border-r border-hairline bg-surface lg:flex">
        <div className="px-5 pb-2 pt-5">
          <IteraLogo />
          <p className="mt-1 text-[13px] font-medium text-ink-500">Client Portal</p>
        </div>

        <div className="mx-4 mt-3 rounded-2xl bg-canvas p-3.5">
          <p className="line-clamp-2 text-[15px] font-semibold leading-snug text-ink-950">{file.propertyAddress}</p>
          <StatusBadge status={file.status} size="sm" className="mt-2" />
        </div>

        <nav className="mt-4 flex-1 space-y-1 overflow-y-auto px-3">
          {CLIENT_TABS.map((t) => (
            <NavLink key={t} t={t} />
          ))}
        </nav>

        <div className="border-t border-hairline p-4">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-500">Your agent</p>
          <div className="mt-2 flex items-center gap-3">
            <Avatar name={agentName} size="md" />
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold text-ink-950">{agentName}</p>
              <p className="truncate text-[13px] text-ink-500">{agent?.brokerage ?? "Your brokerage"}</p>
            </div>
          </div>
          <Link
            href={clientTabHref(file.id, "messages")}
            className="mt-3 flex h-10 items-center justify-center gap-2 rounded-xl bg-ink-950 text-[14px] font-semibold text-white hover:bg-ink-800"
          >
            <MessageSquare className="h-4 w-4" />
            Message {agentName.split(" ")[0]}
          </Link>
        </div>
      </aside>

      <div className="lg:pl-[272px]">
        {/* Mobile header + section rail */}
        <header className="sticky top-0 z-30 border-b border-hairline bg-canvas/90 backdrop-blur-xl lg:hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <IteraLogo className="scale-90 origin-left" />
              <p className="mt-0.5 truncate text-[14px] font-medium text-ink-600">{file.propertyAddress}</p>
            </div>
            <StatusBadge status={file.status} size="sm" />
          </div>
          <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-3">
            {CLIENT_TABS.map((t) => (
              <NavLink key={t} t={t} compact />
            ))}
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 pb-16 pt-6 sm:px-6 lg:px-10 lg:pt-10">{children}</main>
      </div>
    </div>
  );
}

/** The card every client section is built from. */
export function PCard({
  title,
  icon: Icon,
  action,
  children,
  className,
}: {
  title?: string;
  icon?: React.ElementType;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border border-hairline bg-surface shadow-sm", className)}>
      {title && (
        <header className="flex items-center justify-between gap-3 border-b border-hairline px-5 py-4">
          <h2 className="flex items-center gap-2.5 text-[18px] font-semibold text-ink-950">
            {Icon && <Icon className="h-5 w-5 text-ink-500" />}
            {title}
          </h2>
          {action}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function PageTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-[28px] font-bold leading-tight tracking-[-0.03em] text-ink-950">{title}</h1>
      {sub && <p className="mt-1.5 text-[16px] text-ink-500">{sub}</p>}
    </div>
  );
}
