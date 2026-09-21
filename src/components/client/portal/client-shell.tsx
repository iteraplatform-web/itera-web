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
import { TopoPattern } from "@/components/layout/topo-pattern";
import { daysToClosing } from "@/lib/client/portal";
import { STATUS_THEME } from "@/lib/utils/status-theme";
import { STATUS_LABELS } from "@/types";
import { Avatar } from "@/components/ui/misc";
import { StatusBadge } from "@/components/ui/status-badge";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores";
import { useClientAuthStore } from "@/stores/client-auth-store";
import { cn } from "@/lib/utils/cn";
import type { TransactionFile } from "@/types";

export type ClientTab = "home" | "progress" | "documents" | "messages" | "property" | "money" | "help";

export const CLIENT_TABS: ClientTab[] = ["home", "progress", "documents", "messages", "property", "money", "help"];

/** The tabs this client may see — Home, Messages, and Help are always on. */
export function visibleClientTabs(file: TransactionFile): ClientTab[] {
  const v = file.portalAccess?.visibility;
  return CLIENT_TABS.filter((t) => {
    if (t === "help") return false; // reached from the link at the bottom, not the main list
    if (!v) return true;
    if (t === "progress") return v.progress;
    if (t === "documents") return v.documents;
    if (t === "property") return v.property;
    if (t === "money") return v.money;
    return true;
  });
}

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
  const router = useRouter();
  const signOut = useClientAuthStore((s) => s.signOut);
  const tabs = visibleClientTabs(file);
  const meta = tabMeta(file);
  const daysLeft = daysToClosing(file);
  const leave = () => {
    signOut();
    router.push("/client/login");
  };
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
          compact
            ? active
              ? "bg-ink-950 text-white shadow-sm"
              : "bg-surface text-ink-700 ring-1 ring-inset ring-hairline"
            : active
            ? "bg-cream-200/80 font-semibold text-cream-ink"
            : "text-cream-ink/80 hover:bg-cream-200/45 hover:text-cream-ink"
        )}
      >
        <Icon className={cn("h-5 w-5 shrink-0", compact && (active ? "text-white" : "text-ink-500"))} strokeWidth={1.75} />
        <span className="flex-1">{meta[t].label}</span>
        {badge ? (
          <span className="tnum rounded-full bg-red-500 px-2 py-0.5 text-[12px] font-bold text-white">
            {badge}
          </span>
        ) : null}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-100 to-cream-50">
      {/* Desktop sidebar — the same warm style as the agent side */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[288px] flex-col overflow-hidden lg:flex">
        <TopoPattern className="pointer-events-none absolute inset-x-0 top-0 h-[340px] w-full text-cream-300" />
        <div className="relative flex-1 overflow-y-auto px-5 pb-4 pt-7">
          <IteraLogo wordClassName="text-cream-ink" />
          <h2 className="mt-7 font-serif text-[30px] font-medium leading-[1.12] tracking-[-0.01em] text-cream-ink">
            Welcome back,
            <br />
            <span className="font-semibold">{file.clientName.replace(/&.*$/, "").trim().split(" ")[0]}!</span>
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-cream-ink/70">
            {file.propertyAddress.split(",")[0]}
            <br />
            <span className={cn("font-semibold", STATUS_THEME[file.status].text)}>{STATUS_LABELS[file.status]}</span>
          </p>

          <nav className="mt-7 space-y-1" aria-label="Portal">
            {tabs.map((t) => (
              <NavLink key={t} t={t} />
            ))}
          </nav>
        </div>

        <div className="relative shrink-0 px-5 pb-4">
          {daysLeft !== null && daysLeft >= 0 && file.status !== "closed" ? (
            <div className="pb-3">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-cream-ink/60">Closing in</p>
              <p className="tnum mt-1 font-serif text-[34px] font-medium leading-none text-cream-ink">
                {daysLeft} day{daysLeft === 1 ? "" : "s"}
              </p>
            </div>
          ) : null}
          <div className="flex items-center gap-3 border-t border-cream-300/70 py-3">
            <Avatar name={agentName} size="md" />
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-cream-ink/60">Your agent</p>
              <p className="truncate text-[15px] font-semibold text-cream-ink">{agentName}</p>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-cream-300/70 pt-3">
            <Link href={clientTabHref(file.id, "help")} className="flex items-center gap-2 text-[15px] font-medium text-cream-ink/80 hover:text-cream-ink">
              <CircleHelp className="h-4 w-4" />
              Help
            </Link>
            <button onClick={leave} className="text-[15px] font-medium text-cream-ink/80 hover:text-cream-ink">
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:py-3 lg:pl-[288px] lg:pr-3">
        <div className="min-h-screen bg-canvas lg:min-h-[calc(100vh-24px)] lg:rounded-[28px] lg:shadow-[0_1px_3px_rgba(20,20,19,0.08),0_12px_32px_-12px_rgba(20,20,19,0.14)] lg:ring-1 lg:ring-cream-300/60">
        {/* Mobile header + section rail */}
        <header className="sticky top-0 z-30 border-b border-hairline bg-canvas/90 backdrop-blur-xl lg:hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <IteraLogo className="scale-90 origin-left" />
              <p className="mt-0.5 truncate text-[14px] font-medium text-ink-600">{file.propertyAddress}</p>
            </div>
            <div className="flex items-center gap-1">
              <Link href={clientTabHref(file.id, "help")} className="rounded-lg px-2.5 py-2 text-[15px] font-medium text-ink-600">
                Help
              </Link>
              <button onClick={leave} className="rounded-lg px-2.5 py-2 text-[15px] font-medium text-ink-600">
                Sign out
              </button>
            </div>
          </div>
          <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-3">
            {tabs.map((t) => (
              <NavLink key={t} t={t} compact />
            ))}
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 pb-16 pt-6 sm:px-6 lg:px-10 lg:pt-10">{children}</main>
        </div>
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
      <h1 className="font-serif text-[34px] font-medium leading-tight tracking-[-0.01em] text-ink-950">{title}</h1>
      {sub && <p className="mt-1.5 text-[16px] text-ink-500">{sub}</p>}
    </div>
  );
}
