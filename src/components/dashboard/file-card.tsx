"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  FileWarning,
  Gift,
  Home,
  Plane,
  Search,
  Tag,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { BlobImage } from "@/components/ui/blob-image";
import { ProgressRing } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  getFileProgress,
  getMostUrgentTask,
  getOverdueTaskCount,
  getPendingDocumentCount,
} from "@/lib/selectors/file-metrics";
import { daysRemaining, isOverdue } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";
import type { TransactionFile } from "@/types";

export function FileCard({ file }: { file: TransactionFile }) {
  const progress = getFileProgress(file);
  const nextTask = getMostUrgentTask(file);
  const overdue = getOverdueTaskCount(file);
  const pendingDocs = getPendingDocumentCount(file);

  const days = nextTask?.dueDate ? daysRemaining(nextTask.dueDate) : null;
  const late = nextTask?.dueDate ? isOverdue(nextTask.dueDate) : false;

  const dueTone = late
    ? "bg-red-50 text-red-700 ring-red-200/70"
    : days !== null && days <= 3
    ? "bg-red-50 text-red-700 ring-red-200/70"
    : days !== null && days <= 7
    ? "bg-amber-50 text-amber-700 ring-amber-200/70"
    : "bg-emerald-50 text-emerald-700 ring-emerald-200/70";

  const activeOffers = file.offers.filter((o) => o.status === "pending").length;

  return (
    <Link
      href={`/files/${file.id}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border bg-surface shadow-sm transition-all duration-200",
        "hover:-translate-y-0.5 hover:shadow-lg",
        overdue > 0 ? "border-red-200" : "border-hairline hover:border-hairline-strong"
      )}
    >
      {/* Status accent rail down the left edge */}
      <span
        className={cn(
          "absolute inset-y-0 left-0 w-[3px]",
          overdue > 0 ? "bg-red-500" : file.status === "closed" ? "bg-emerald-500" : "bg-transparent"
        )}
      />

      {file.coverPhotoId && file.photos?.find((p) => p.id === file.coverPhotoId) && (
        <BlobImage
          blobKey={file.photos.find((p) => p.id === file.coverPhotoId)!.thumbBlobId}
          alt={`Cover photo of ${file.propertyAddress}`}
          className="aspect-[16/7] w-full"
        />
      )}
      <div className="flex-1 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-[13px] font-medium text-ink-500">
              {file.side === "listing" ? (
                <Home className="h-3 w-3" />
              ) : (
                <Search className="h-3 w-3" />
              )}
              {file.side === "listing" ? "Listing" : "Buyer"}
              {file.isQuickLead && <span className="text-amber-600">· Quick lead</span>}
            </div>
            <h3 className="mt-1.5 truncate text-[16px] font-semibold leading-snug text-ink-950">
              {file.propertyAddress || file.clientName}
            </h3>
            <p className="mt-0.5 truncate text-[14px] text-ink-500">{file.clientName}</p>
          </div>

          <ProgressRing
            value={progress}
            size={44}
            barClassName={
              progress === 100 ? "text-emerald-500" : overdue > 0 ? "text-red-500" : "text-itera-600"
            }
          >
            <span className="tnum text-[12px] font-bold text-ink-700">{progress}%</span>
          </ProgressRing>
        </div>

        {/* Flags: only what the scope calls out as worth showing on purpose */}
        {(file.isReferral || file.isRelocation || activeOffers > 0 || file.builtBefore1978) && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {file.isReferral && (
              <Badge variant="purple" size="xs">
                <Gift className="h-2.5 w-2.5" />
                Referral
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
                <Tag className="h-2.5 w-2.5" />
                Pre-1978
              </Badge>
            )}
            {activeOffers > 0 && (
              <Badge variant="amber" size="xs">
                {activeOffers} offer{activeOffers === 1 ? "" : "s"} pending
              </Badge>
            )}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between gap-3">
          <StatusBadge status={file.status} />
          <span className="tnum text-[16px] font-bold tracking-[-0.02em] text-ink-950">
            {file.listPrice > 0 ? `$${file.listPrice.toLocaleString()}` : "—"}
          </span>
        </div>
      </div>

      {/* Next task footer */}
      <div className="border-t border-hairline bg-canvas/70 px-5 py-3.5">
        {nextTask ? (
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-500">
                Next up
              </p>
              <p className="mt-0.5 truncate text-[14px] font-medium text-ink-800">
                {nextTask.title}
              </p>
            </div>
            {days !== null && (
              <span
                className={cn(
                  "tnum inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[13px] font-bold ring-1 ring-inset",
                  dueTone
                )}
              >
                <Clock className="h-3 w-3" />
                {late ? `${Math.abs(days)}d over` : days === 0 ? "Today" : `${days}d`}
              </span>
            )}
          </div>
        ) : (
          <p className="text-[13px] font-medium text-emerald-700">
            Every task complete
          </p>
        )}

        {(overdue > 0 || pendingDocs > 0) && (
          <div className="mt-2.5 flex flex-wrap items-center gap-3 border-t border-hairline pt-2.5 text-[13px]">
            {overdue > 0 && (
              <span className="inline-flex items-center gap-1 font-semibold text-red-600">
                <AlertTriangle className="h-3 w-3" />
                {overdue} overdue
              </span>
            )}
            {pendingDocs > 0 && (
              <span className="inline-flex items-center gap-1 text-ink-500">
                <FileWarning className="h-3 w-3" />
                {pendingDocs} document{pendingDocs === 1 ? "" : "s"} outstanding
              </span>
            )}
            <ArrowRight className="ml-auto h-3.5 w-3.5 text-ink-400 transition-transform group-hover:translate-x-0.5" />
          </div>
        )}
      </div>
    </Link>
  );
}
