"use client";

import Link from "next/link";
import {
  Calendar,
  ExternalLink,
  Gift,
  Home,
  Mail,
  MapPin,
  Phone,
  Plane,
  Search,
  Tag,
  Zap,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar } from "@/components/ui/misc";
import { STATUS_THEME } from "@/lib/utils/status-theme";
import { formatDate } from "@/lib/utils/dates";
import {
  getFileProgress,
  getOverdueTaskCount,
  getPendingDocumentCount,
} from "@/lib/selectors/file-metrics";
import type { TransactionFile, TransactionStatus } from "@/types";
import { STATUS_LABELS } from "@/types";
import { cn } from "@/lib/utils/cn";

interface FileHeaderProps {
  file: TransactionFile;
  onStatusChange: (status: TransactionStatus) => void;
}

export function FileHeader({ file, onStatusChange }: FileHeaderProps) {
  const progress = getFileProgress(file);
  const overdue = getOverdueTaskCount(file);
  const pendingDocs = getPendingDocumentCount(file);
  const receivedDocs = file.documents.filter((d) => d.status === "received").length;
  const completedTasks = file.checklist.filter((t) => t.status === "completed").length;
  const theme = STATUS_THEME[file.status];

  return (
    <div className="overflow-hidden rounded-2xl border border-hairline bg-surface shadow-sm">
      {/* Status colour reads before anything else on the page */}
      <div className={cn("h-1", theme.solid)} />

      <div className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <StatusBadge status={file.status} />
              <Badge variant="gray" size="xs">
                {file.side === "listing" ? (
                  <Home className="h-2.5 w-2.5" />
                ) : (
                  <Search className="h-2.5 w-2.5" />
                )}
                {file.side === "listing" ? "Listing" : "Buyer"}
              </Badge>
              {file.isReferral && (
                <Badge variant="purple" size="xs">
                  <Gift className="h-2.5 w-2.5" />
                  Referral{file.referralPercentage ? ` · ${file.referralPercentage}%` : ""}
                </Badge>
              )}
              {file.isRelocation && (
                <Badge variant="default" size="xs">
                  <Plane className="h-2.5 w-2.5" />
                  Relocation
                </Badge>
              )}
              {file.builtBefore1978 && (
                <Badge variant="gray" size="xs">
                  Built pre-1978
                </Badge>
              )}
              {file.isQuickLead && (
                <Badge variant="amber" size="xs">
                  <Zap className="h-2.5 w-2.5" />
                  Quick lead — intake incomplete
                </Badge>
              )}
            </div>

            <h1 className="mt-3 flex items-start gap-2.5 text-[26px] font-bold leading-tight tracking-[-0.03em] text-ink-950">
              <MapPin className="mt-1 h-5 w-5 shrink-0 text-ink-400" />
              <span className="min-w-0">{file.propertyAddress}</span>
            </h1>

            {/* Client identity block */}
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
              <span className="flex items-center gap-2">
                <Avatar name={file.clientName} size="sm" />
                <span>
                  <span className="block text-[14px] font-semibold text-ink-900">
                    {file.clientName}
                  </span>
                  {file.coClientName && (
                    <span className="block text-[13px] text-ink-500">
                      with {file.coClientName}
                    </span>
                  )}
                </span>
              </span>

              {file.phone && <Meta icon={Phone} value={file.phone} />}
              {file.email && <Meta icon={Mail} value={file.email} />}
              {file.closingDate && (
                <Meta
                  icon={Calendar}
                  value={`Closes ${formatDate(file.closingDate, "MMM d, yyyy")}`}
                />
              )}
              {file.leadSource && <Meta icon={Tag} value={file.leadSource} />}
            </div>
          </div>

          {/* Price + actions */}
          <div className="flex shrink-0 flex-col items-start gap-3 lg:items-end">
            <div className="lg:text-right">
              <p className="tnum text-[30px] font-bold leading-none tracking-[-0.03em] text-ink-950">
                {file.listPrice > 0 ? `$${file.listPrice.toLocaleString()}` : "TBD"}
              </p>
              <p className="mt-1 text-[13px] text-ink-500">
                {file.side === "listing" ? "List / sale price" : "Target price"}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={file.status}
                onChange={(e) => onStatusChange(e.target.value as TransactionStatus)}
                className="h-9 cursor-pointer rounded-[10px] border-0 bg-canvas px-3 text-[14px] font-semibold text-ink-800 ring-1 ring-inset ring-hairline-strong transition-shadow focus:outline-none focus:ring-2 focus:ring-itera-500"
              >
                {Object.entries(STATUS_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>

              <Link href={`/client/${file.id}`} target="_blank">
                <Button size="sm" variant="secondary">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Client view
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* ── Metrics strip ─────────────────────────────────────── */}
        <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-hairline bg-hairline sm:grid-cols-4">
          <Metric
            label="Checklist"
            value={`${completedTasks}/${file.checklist.length}`}
            sub={`${progress}% complete`}
          />
          <Metric
            label="Documents"
            value={`${receivedDocs}/${file.documents.length}`}
            sub={pendingDocs > 0 ? `${pendingDocs} outstanding` : "All received"}
            tone={pendingDocs > 0 ? "amber" : "green"}
          />
          <Metric
            label="Overdue"
            value={String(overdue)}
            sub={overdue > 0 ? "Past due now" : "On track"}
            tone={overdue > 0 ? "red" : "green"}
          />
          <Metric
            label="Communications"
            value={String(file.messages.length + file.sentEmails.length)}
            sub={`${file.sentEmails.length} email${file.sentEmails.length === 1 ? "" : "s"} sent`}
          />
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-ink-500">Overall transaction progress</span>
            <span className="tnum font-semibold text-ink-700">{progress}%</span>
          </div>
          <Progress
            value={progress}
            className="mt-2"
            barClassName={progress === 100 ? "from-emerald-400 to-emerald-500" : undefined}
          />
        </div>
      </div>
    </div>
  );
}

function Meta({ icon: Icon, value }: { icon: React.ElementType; value: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[13px] text-ink-500">
      <Icon className="h-3.5 w-3.5 shrink-0 text-ink-400" />
      <span className="truncate">{value}</span>
    </span>
  );
}

function Metric({
  label,
  value,
  sub,
  tone = "neutral",
}: {
  label: string;
  value: string;
  sub: string;
  tone?: "neutral" | "green" | "amber" | "red";
}) {
  const subTone = {
    neutral: "text-ink-500",
    green: "text-emerald-600",
    amber: "text-amber-600",
    red: "text-red-600 font-medium",
  }[tone];

  return (
    <div className="bg-surface px-4 py-3">
      <p className="section-title">{label}</p>
      <p className="tnum mt-1.5 text-[20px] font-bold leading-none text-ink-950">{value}</p>
      <p className={cn("mt-1.5 text-[13px]", subTone)}>{sub}</p>
    </div>
  );
}

/**
 * One line of context for every tab except Overview: which file this is, its
 * status, and the two controls agents reach for most. Keeps the work itself
 * above the fold.
 */
export function FileHeaderCompact({ file, onStatusChange }: FileHeaderProps) {
  const theme = STATUS_THEME[file.status];
  return (
    <div className="relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-hairline bg-surface px-5 py-4 shadow-sm sm:flex-row sm:items-center">
      <span className={cn("absolute inset-y-0 left-0 w-1", theme.solid)} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[18px] font-bold tracking-[-0.02em] text-ink-950">
          {file.propertyAddress}
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] text-ink-500">
          <span className="font-medium text-ink-700">{file.clientName}</span>
          {file.phone && (
            <a href={`tel:${file.phone.replace(/[^\d+]/g, "")}`} className="hover:text-itera-700 hover:underline">
              {file.phone}
            </a>
          )}
          <span className="tnum font-semibold text-ink-800">
            {file.listPrice > 0 ? `$${file.listPrice.toLocaleString()}` : "Price not set"}
          </span>
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="status-compact">
          File status
        </label>
        <select
          id="status-compact"
          value={file.status}
          onChange={(e) => onStatusChange(e.target.value as TransactionStatus)}
          className="h-10 cursor-pointer rounded-[10px] border-0 bg-canvas px-3 text-[14px] font-semibold text-ink-800 ring-1 ring-inset ring-hairline-strong focus:outline-none focus:ring-2 focus:ring-itera-500"
        >
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <Link href={`/client/${file.id}`} target="_blank">
          <Button size="sm" variant="secondary">
            <ExternalLink className="h-4 w-4" />
            Client view
          </Button>
        </Link>
      </div>
    </div>
  );
}
