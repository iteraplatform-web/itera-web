"use client";

import Link from "next/link";
import {
  CheckSquare,
  DollarSign,
  Eye,
  FileText,
  Home,
  LayoutDashboard,
  Mail,
  Search,
  StickyNote,
  UserRound,
} from "lucide-react";
import type { TransactionFile, WorkspaceSection } from "@/types";
import { cn } from "@/lib/utils/cn";

type Tone = "amber" | "red";

interface SubDef {
  key: WorkspaceSection;
  label: string;
  sides?: Array<"listing" | "buying">;
}

interface NavDef {
  /** Where the item lands when clicked. */
  key: WorkspaceSection;
  label: string | ((f: TransactionFile) => string);
  icon: React.ElementType;
  /** For items whose icon depends on whether the file is a listing or a buyer. */
  iconFor?: (f: TransactionFile) => React.ElementType;
  /** Screens grouped under this item, shown as tabs across the top. */
  subs?: SubDef[];
  badge?: (f: TransactionFile) => { text: string; tone: Tone } | null;
}

/**
 * The file's sections, following the six areas in the product documents —
 * Checklist, Documents, Communications, Financials, Notes & Activity, Client
 * View — plus the Overview and two groups that hold the detailed work
 * screens as tabs, so the sidebar stays short.
 */
export const FILE_NAV: NavDef[] = [
  {
    key: "overview",
    label: "Overview",
    icon: LayoutDashboard,
    badge: (f) => {
      const late = f.checklist.filter((t) => t.status !== "completed" && t.dueDate && new Date(t.dueDate) < new Date()).length;
      return late ? { text: `${late} late`, tone: "red" } : null;
    },
  },
  {
    key: "checklist",
    label: "Checklist",
    icon: CheckSquare,
    subs: [
      { key: "checklist", label: "Tasks" },
      { key: "milestones", label: "Milestones & agreements" },
    ],
  },
  {
    key: "documents",
    label: "Documents",
    icon: FileText,
    badge: (f) => {
      const n = f.documents.filter((d) => d.status === "needed").length;
      return n ? { text: `${n} needed`, tone: "amber" } : null;
    },
  },
  {
    key: "communications",
    label: "Messages",
    icon: Mail,
    badge: (f) => {
      const last = f.messages[f.messages.length - 1];
      return last?.sender === "client" ? { text: "Reply", tone: "amber" } : null;
    },
  },
  {
    key: "financials",
    label: "Money",
    icon: DollarSign,
    badge: (f) => {
      const n = f.offers.filter((o) => o.status === "pending").length;
      return n ? { text: `${n} offer${n === 1 ? "" : "s"}`, tone: "amber" } : null;
    },
  },
  {
    key: "pricing",
    label: (f) => (f.side === "listing" ? "Property" : "Home Search"),
    icon: Home,
    iconFor: (f) => (f.side === "listing" ? Home : Search),
    subs: [
      { key: "pricing", label: "Pricing", sides: ["listing"] },
      { key: "listing_details", label: "Listing sheet", sides: ["listing"] },
      { key: "property_work", label: "Prep", sides: ["listing"] },
      { key: "marketing", label: "Search criteria", sides: ["buying"] },
      { key: "photos", label: "Photos" },
      { key: "showings", label: "Showings" },
      { key: "marketing", label: "Marketing", sides: ["listing"] },
      { key: "analytics", label: "Performance", sides: ["listing"] },
    ],
  },
  { key: "client_profile", label: "Client", icon: UserRound },
  { key: "notes", label: "Notes & History", icon: StickyNote },
  { key: "client_view", label: "Client Portal", icon: Eye },
];

function visibleSubs(item: NavDef, file: TransactionFile): SubDef[] {
  return (item.subs ?? []).filter((s) => !s.sides || s.sides.includes(file.side));
}

/** The sidebar item a section belongs to, and that item's visible tabs. */
export function navFor(section: WorkspaceSection, file: TransactionFile) {
  const item =
    FILE_NAV.find((n) => n.key === section) ??
    FILE_NAV.find((n) => visibleSubs(n, file).some((s) => s.key === section)) ??
    FILE_NAV[0];
  const subs = visibleSubs(item, file);
  const landing = subs[0]?.key ?? item.key;
  return {
    item,
    subs,
    landing,
    label: typeof item.label === "function" ? item.label(file) : item.label,
  };
}

/** The one URL for any section of any file, optionally opening a specific item. */
export function sectionHref(fileId: string, section: WorkspaceSection, focus?: string): string {
  const params = new URLSearchParams();
  if (section !== "overview") params.set("tab", section);
  if (focus) params.set("focus", focus);
  const q = params.toString();
  return `/files/${fileId}${q ? `?${q}` : ""}`;
}

export function FileSectionNav({
  file,
  active,
  onNavigate,
  variant = "sidebar",
}: {
  file: TransactionFile;
  active: WorkspaceSection;
  onNavigate?: () => void;
  variant?: "sidebar" | "rail";
}) {
  const activeItem = navFor(active, file).item;

  return (
    <nav
      aria-label="File sections"
      className={variant === "rail" ? "no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1" : "space-y-0.5"}
    >
      {FILE_NAV.map((item) => {
        const { landing, label } = navFor(item.key, file);
        const Icon = item.iconFor ? item.iconFor(file) : item.icon;
        const isActive = item === activeItem;
        const badge = item.badge?.(file) ?? null;
        return (
          <Link
            key={label}
            href={sectionHref(file.id, landing)}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              variant === "rail"
                ? "flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2.5 text-[15px] font-semibold"
                : "flex min-h-[38px] items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[14px] transition-colors",
              variant === "rail"
                ? isActive
                  ? "bg-ink-950 text-white shadow-sm"
                  : "bg-surface text-ink-700 ring-1 ring-inset ring-hairline"
                : isActive
                ? "bg-cream-200/80 font-semibold text-cream-ink"
                : "font-medium text-cream-ink/75 hover:bg-cream-200/45 hover:text-cream-ink"
            )}
          >
            <Icon
              className={cn("h-[18px] w-[18px] shrink-0", variant === "rail" && (isActive ? "text-white" : "text-ink-500"))}
              strokeWidth={1.75}
            />
            <span className="min-w-0 flex-1 truncate">{label}</span>
            {badge && (
              <span
                className={cn(
                  "tnum shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-semibold",
                  variant === "rail" && isActive
                    ? "bg-white/20 text-white"
                    : "bg-cream-ink/10 text-cream-ink/75"
                )}
              >
                {badge.text}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

/** Tabs across the top for sections that group several screens. */
export function SubTabs({ file, active }: { file: TransactionFile; active: WorkspaceSection }) {
  const { subs } = navFor(active, file);
  if (subs.length < 2) return null;
  return (
    <div className="no-scrollbar -mx-1 mb-5 flex gap-1 overflow-x-auto border-b border-hairline px-1" role="tablist">
      {subs.map((s) => {
        const on = s.key === active;
        return (
          <Link
            key={s.key + s.label}
            href={sectionHref(file.id, s.key)}
            role="tab"
            aria-selected={on}
            className={cn(
              "-mb-px shrink-0 border-b-[3px] px-4 py-3 text-[16px] font-semibold transition-colors",
              on ? "border-itera-600 text-ink-950" : "border-transparent text-ink-500 hover:text-ink-900"
            )}
          >
            {s.label}
          </Link>
        );
      })}
    </div>
  );
}
