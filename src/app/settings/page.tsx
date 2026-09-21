"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  Info,
  Layers,
  Lock,
  MapPin,
  Palette,
  Sparkles,
} from "lucide-react";
import { AuthGuard } from "@/components/layout/auth-guard";
import { AppShell } from "@/components/layout/app-shell";
import { CommissionTerms } from "@/components/settings/commission-terms";
import { Badge } from "@/components/ui/badge";
import { Segmented } from "@/components/ui/misc";
import { SectionLabel } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getChecklistTemplateRules } from "@/lib/checklist/engine";
import { KANBAN_COLUMNS } from "@/lib/utils/status-theme";
import { useAuthStore } from "@/stores";
import { PHASE_LABELS, type ChecklistPhase } from "@/types";
import { cn } from "@/lib/utils/cn";

type Tab = "templates" | "statuses" | "practice";

export default function SettingsPage() {
  return (
    <AuthGuard>
      <SettingsContent />
    </AuthGuard>
  );
}

function SettingsContent() {
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<Tab>("templates");
  const rules = useMemo(() => getChecklistTemplateRules(), []);

  const byPhase = useMemo(() => {
    const map = new Map<ChecklistPhase, typeof rules>();
    rules.forEach((r) => {
      map.set(r.phase, [...(map.get(r.phase) ?? []), r]);
    });
    return map;
  }, [rules]);

  const conditionalCount = rules.filter((r) => r.isConditional).length;

  return (
    <AppShell crumbs={[{ label: "Home", href: "/dashboard" }, { label: "Settings" }]}>
      <div className="mx-auto max-w-5xl">
        <div>
          <h1 className="font-serif text-[32px] font-medium leading-tight tracking-[-0.01em] text-ink-950">
            Settings
          </h1>
          <p className="mt-2 text-[15px] text-ink-500">
            The rules behind every file. Set once here, applied across the whole portfolio.
          </p>
        </div>

        <div className="mt-5">
          <Segmented
            value={tab}
            onChange={setTab}
            options={[
              { value: "templates", label: "Checklist templates", icon: Layers },
              { value: "statuses", label: "Statuses", icon: Palette },
              { value: "practice", label: "Practice", icon: Building2 },
            ]}
          />
        </div>

        {/* ── Checklist template library ─────────────────────────── */}
        {tab === "templates" && (
          <div className="mt-6 space-y-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <Stat value={rules.length} label="Tasks in the library" />
              <Stat value={conditionalCount} label="Conditional rules" />
              <Stat
                value={rules.reduce((n, r) => n + r.subtaskCount, 0)}
                label="Individual steps"
              />
            </div>

            <div className="flex items-start gap-2.5 rounded-xl border border-hairline bg-surface px-4 py-3">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-500" />
              <p className="text-[14px] leading-relaxed text-ink-500">
                This is the library the checklist assembles from. Which tasks appear on a
                given file is plain rule-based logic, not a model — the outcome has to be
                the same every time.
              </p>
            </div>

            {(Object.keys(PHASE_LABELS) as ChecklistPhase[])
              .filter((phase) => byPhase.has(phase))
              .map((phase) => (
                <section key={phase}>
                  <SectionLabel>{PHASE_LABELS[phase]}</SectionLabel>
                  <ul className="overflow-hidden rounded-xl border border-hairline">
                    {byPhase.get(phase)!.map((rule, i) => (
                      <li
                        key={rule.id}
                        className={cn(
                          "bg-surface px-4 py-3",
                          i > 0 && "border-t border-hairline"
                        )}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <p className="text-[14px] font-semibold text-ink-950">
                            {rule.taskTitle}
                          </p>
                          <Badge variant={rule.isConditional ? "purple" : "gray"} size="xs">
                            {rule.isConditional && <Sparkles className="h-2.5 w-2.5" />}
                            {rule.appliesWhen}
                          </Badge>
                        </div>

                        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-ink-500">
                          {rule.subtaskCount > 0 && (
                            <span>{rule.subtaskCount} steps</span>
                          )}
                          {rule.dependsOnTitles.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Lock className="h-3 w-3" />
                              Unlocks after {rule.dependsOnTitles.join(" and ")}
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
          </div>
        )}

        {/* ── Status system ──────────────────────────────────────── */}
        {tab === "statuses" && (
          <div className="mt-6 space-y-5">
            <div className="flex items-start gap-2.5 rounded-xl border border-hairline bg-surface px-4 py-3">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-500" />
              <p className="text-[14px] leading-relaxed text-ink-500">
                Each status maps onto one of four meanings, so a colour never means two
                things anywhere in the product.
              </p>
            </div>

            <ul className="grid gap-3 sm:grid-cols-2">
              {KANBAN_COLUMNS.map((status) => (
                <li
                  key={status}
                  className="flex items-center justify-between gap-3 rounded-xl border border-hairline bg-surface px-4 py-3.5"
                >
                  <StatusBadge status={status} />
                  <span className="text-[13px] text-ink-500">
                    Appears as a board column
                  </span>
                </li>
              ))}
            </ul>

            <div>
              <SectionLabel>Colour meanings</SectionLabel>
              <ul className="overflow-hidden rounded-xl border border-hairline">
                {[
                  { dot: "bg-emerald-500", label: "Green", meaning: "On track, complete, or received" },
                  { dot: "bg-amber-500", label: "Amber", meaning: "Pending or in progress" },
                  { dot: "bg-red-500", label: "Red", meaning: "Needs attention now" },
                  { dot: "bg-ink-400", label: "Gray", meaning: "Not yet started, or informational" },
                ].map((row, i) => (
                  <li
                    key={row.label}
                    className={cn(
                      "flex items-center gap-3 bg-surface px-4 py-3",
                      i > 0 && "border-t border-hairline"
                    )}
                  >
                    <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", row.dot)} />
                    <span className="w-16 shrink-0 text-[14px] font-semibold text-ink-900">
                      {row.label}
                    </span>
                    <span className="text-[14px] text-ink-500">{row.meaning}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* ── Practice details ───────────────────────────────────── */}
        {tab === "practice" && (
          <div className="mt-6 space-y-5">
            <CommissionTerms />
            <div className="rounded-2xl border border-hairline bg-surface p-5">
              <SectionLabel icon={Building2}>Brokerage</SectionLabel>
              <p className="text-[16px] font-semibold text-ink-950">
                {user?.brokerage ?? "Not set"}
              </p>
              <p className="mt-1 text-[14px] text-ink-500">
                Appears on outgoing email signatures.
              </p>
            </div>

            <div className="rounded-2xl border border-hairline bg-surface p-5">
              <SectionLabel icon={MapPin}>Markets</SectionLabel>
              <div className="flex flex-wrap gap-2">
                {user?.markets?.length ? (
                  user.markets.map((m) => (
                    <Badge key={m} variant="gray">
                      {m}
                    </Badge>
                  ))
                ) : (
                  <p className="text-[14px] text-ink-500">None set</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-dashed border-hairline-strong bg-canvas px-5 py-4">
              <p className="text-[14px] font-semibold text-ink-800">
                Team members, billing, and integrations
              </p>
              <p className="mt-1 text-[14px] leading-relaxed text-ink-500">
                Out of scope for this demonstration. In the finished product these live
                here alongside checklist templates and statuses.
              </p>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl border border-hairline bg-surface px-4 py-3.5">
      <p className="tnum text-[26px] font-bold leading-none tracking-[-0.03em] text-ink-950">
        {value}
      </p>
      <p className="mt-1.5 text-[13px] text-ink-500">{label}</p>
    </div>
  );
}
