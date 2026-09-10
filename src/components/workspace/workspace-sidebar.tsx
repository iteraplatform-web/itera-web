"use client";

import Link from "next/link";
import {
  BarChart3,
  CheckSquare,
  ClipboardList,
  DollarSign,
  Eye,
  FileText,
  Flag,
  Hammer,
  Home,
  Images,
  LayoutDashboard,
  LineChart,
  Mail,
  Megaphone,
  StickyNote,
  UserRound,
} from "lucide-react";
import type { TransactionFile, WorkspaceSection } from "@/types";
import { cn } from "@/lib/utils/cn";
import {
  buyerSearchReadiness,
  clientProfileReadiness,
  cmaReadiness,
  listingReadiness,
  marketingReadiness,
  milestonesReadiness,
  propertyPrepReadiness,
  showingsReadiness,
} from "@/lib/work/readiness";
import type { WorkReadiness } from "@/types";

type Tone = "neutral" | "amber" | "green" | "red";

interface SectionDef {
  key: WorkspaceSection;
  label: string;
  icon: React.ElementType;
  sides?: Array<"listing" | "buying">;
  /** Sections with their own full page rather than a tab. */
  deepHref?: (fileId: string) => string;
  badge?: (file: TransactionFile) => { text: string; tone: Tone } | null;
}

interface SectionGroup {
  label?: string;
  items: SectionDef[];
}

function readinessBadge(r: WorkReadiness): { text: string; tone: Tone } | null {
  if (r === "empty") return null;
  return r === "ready" ? { text: "Done", tone: "green" } : { text: "Started", tone: "amber" };
}

/**
 * Grouped in plain language by what the agent is thinking about — the client,
 * the property, the deal — rather than by how the data is stored.
 */
export const SECTION_GROUPS: SectionGroup[] = [
  {
    items: [
      {
        key: "overview",
        label: "Overview",
        icon: LayoutDashboard,
        badge: (f) => {
          const overdue = f.checklist.filter(
            (t) => t.status !== "completed" && t.dueDate && new Date(t.dueDate) < new Date()
          ).length;
          return overdue > 0 ? { text: `${overdue} late`, tone: "red" } : null;
        },
      },
      {
        key: "checklist",
        label: "Checklist",
        icon: CheckSquare,
        badge: (f) => {
          const done = f.checklist.filter((t) => t.status === "completed").length;
          return { text: `${done}/${f.checklist.length}`, tone: done === f.checklist.length ? "green" : "neutral" };
        },
      },
    ],
  },
  {
    label: "Client",
    items: [
      {
        key: "client_profile",
        label: "Client Profile",
        icon: UserRound,
        badge: (f) => readinessBadge(clientProfileReadiness(f.clientProfile)),
      },
      {
        key: "communications",
        label: "Emails & Messages",
        icon: Mail,
        badge: (f) => {
          const unanswered = f.messages.length > 0 && f.messages[f.messages.length - 1].sender === "client";
          return unanswered ? { text: "Reply", tone: "amber" } : null;
        },
      },
    ],
  },
  {
    label: "Property",
    items: [
      {
        key: "pricing",
        label: "Pricing / CMA",
        icon: LineChart,
        sides: ["listing"],
        deepHref: (id) => `/files/${id}/pricing`,
        badge: (f) => readinessBadge(cmaReadiness(f.cma)),
      },
      {
        key: "listing_details",
        label: "Listing Details",
        icon: Home,
        sides: ["listing"],
        deepHref: (id) => `/files/${id}/listing`,
        badge: (f) => readinessBadge(listingReadiness(f.listingDetails)),
      },
      {
        key: "property_work",
        label: "Prep & Staging",
        icon: Hammer,
        sides: ["listing"],
        badge: (f) => readinessBadge(propertyPrepReadiness(f.propertyPrep)),
      },
      {
        key: "photos",
        label: "Photos",
        icon: Images,
        badge: (f) => ((f.photos?.length ?? 0) > 0 ? { text: String(f.photos.length), tone: "neutral" } : null),
      },
      {
        key: "showings",
        label: "Showings",
        icon: ClipboardList,
        badge: (f) => readinessBadge(showingsReadiness(f.showings, f.side)),
      },
      {
        key: "marketing",
        label: "Marketing",
        icon: Megaphone,
        badge: (f) =>
          readinessBadge(f.side === "buying" ? buyerSearchReadiness(f.buyerSearch) : marketingReadiness(f.marketing)),
      },
    ],
  },
  {
    label: "Deal",
    items: [
      {
        key: "documents",
        label: "Documents",
        icon: FileText,
        badge: (f) => {
          const needed = f.documents.filter((d) => d.status === "needed").length;
          return needed > 0 ? { text: `${needed} needed`, tone: "amber" } : { text: "All in", tone: "green" };
        },
      },
      {
        key: "financials",
        label: "Offers & Money",
        icon: DollarSign,
        badge: (f) => {
          const pending = f.offers.filter((o) => o.status === "pending").length;
          return pending > 0 ? { text: `${pending} offer${pending === 1 ? "" : "s"}`, tone: "amber" } : null;
        },
      },
      {
        key: "milestones",
        label: "Milestones",
        icon: Flag,
        badge: (f) => readinessBadge(milestonesReadiness(f.milestones)),
      },
    ],
  },
  {
    label: "Records",
    items: [
      {
        key: "notes",
        label: "Notes & Activity",
        icon: StickyNote,
        badge: (f) => (f.notes.length > 0 ? { text: String(f.notes.length), tone: "neutral" } : null),
      },
      { key: "analytics", label: "Analytics", icon: BarChart3, deepHref: (id) => `/files/${id}/analytics` },
      { key: "client_view", label: "What the Client Sees", icon: Eye },
    ],
  },
];

/** The one URL for any section of any file, optionally opening a specific item. */
export function sectionHref(fileId: string, section: WorkspaceSection, focus?: string): string {
  for (const group of SECTION_GROUPS) {
    const item = group.items.find((i) => i.key === section);
    if (item?.deepHref) return item.deepHref(fileId);
  }
  const params = new URLSearchParams();
  if (section !== "overview") params.set("tab", section);
  if (focus) params.set("focus", focus);
  const q = params.toString();
  return `/files/${fileId}${q ? `?${q}` : ""}`;
}

/** Kept for existing callers. */
export function sectionDeepHref(section: WorkspaceSection, fileId: string): string | null {
  for (const group of SECTION_GROUPS) {
    const item = group.items.find((i) => i.key === section);
    if (item?.deepHref) return item.deepHref(fileId);
  }
  return null;
}

const TONE_STYLES: Record<Tone, string> = {
  neutral: "bg-ink-100 text-ink-600",
  amber: "bg-amber-100 text-amber-800",
  green: "bg-emerald-100 text-emerald-800",
  red: "bg-red-100 text-red-700",
};

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
  const groups = SECTION_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((i) => !i.sides || i.sides.includes(file.side)),
  })).filter((g) => g.items.length > 0);

  if (variant === "rail") {
    return (
      <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1">
        {groups.flatMap((g) => g.items).map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          return (
            <Link
              key={item.key}
              href={sectionHref(file.id, item.key)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2.5 text-[14px] font-semibold",
                isActive ? "bg-ink-950 text-white" : "bg-surface text-ink-700 ring-1 ring-inset ring-hairline"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((group, gi) => (
        <div key={group.label ?? gi}>
          {group.label && (
            <p className="mb-1 px-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-500">
              {group.label}
            </p>
          )}
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = active === item.key;
              const badge = item.badge?.(file) ?? null;
              return (
                <Link
                  key={item.key}
                  href={sectionHref(file.id, item.key)}
                  onClick={onNavigate}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex min-h-[42px] items-center gap-3 rounded-xl px-3 py-2 text-[15px] font-medium transition-colors",
                    isActive ? "bg-ink-950 text-white shadow-sm" : "text-ink-700 hover:bg-ink-100/70 hover:text-ink-950"
                  )}
                >
                  <Icon className={cn("h-[18px] w-[18px] shrink-0", isActive ? "text-white" : "text-ink-500")} />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {badge && (
                    <span
                      className={cn(
                        "tnum shrink-0 rounded-full px-2 py-0.5 text-[12px] font-semibold",
                        isActive ? "bg-white/15 text-white" : TONE_STYLES[badge.tone]
                      )}
                    >
                      {badge.text}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
