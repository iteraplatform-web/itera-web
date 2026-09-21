"use client";

import Link from "next/link";
import { BlobImage } from "@/components/ui/blob-image";
import { PropertyPlaceholder } from "@/components/ui/property-placeholder";
import { samplePhotoFor } from "@/lib/work/sample-photos";
import { getMostUrgentTask } from "@/lib/selectors/file-metrics";
import { STATUS_THEME } from "@/lib/utils/status-theme";
import { daysRemaining, isOverdue } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";
import { STATUS_LABELS, type TransactionFile } from "@/types";

/**
 * A photo first, the status laid over it, then two equal halves: what it's
 * worth and what's next. The scope's four facts, arranged to be read at a
 * glance.
 */
export function FileCard({ file }: { file: TransactionFile }) {
  const next = getMostUrgentTask(file);
  const days = next?.dueDate ? daysRemaining(next.dueDate) : null;
  const late = next?.dueDate ? isOverdue(next.dueDate) : false;
  const theme = STATUS_THEME[file.status];
  const cover = file.coverPhotoId ? file.photos?.find((p) => p.id === file.coverPhotoId) : undefined;
  const sample = cover ? undefined : samplePhotoFor(file);

  const due =
    days === null
      ? null
      : late
      ? { text: `${Math.abs(days)}d late`, tone: "bg-red-100 text-red-800" }
      : days === 0
      ? { text: "Today", tone: "bg-red-100 text-red-800" }
      : {
          text: `${days} day${days === 1 ? "" : "s"}`,
          tone: days <= 3 ? "bg-red-100 text-red-800" : days <= 7 ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-800",
        };

  return (
    <Link
      href={`/files/${file.id}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border bg-surface shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg",
        late ? "border-red-300 ring-1 ring-red-200" : "border-hairline"
      )}
    >
      {/* ── Image with status overlay ─────────────────────────── */}
      <div className="relative aspect-[16/10] overflow-hidden">
        {cover ? (
          <BlobImage
            blobKey={cover.thumbBlobId}
            alt={`Photo of ${file.propertyAddress}`}
            className="h-full w-full"
            imgClassName="transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : sample ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={sample}
            alt={`Photo of ${file.propertyAddress}`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <PropertyPlaceholder variant={file.side} />
        )}

        <span
          className={cn(
            "absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/92 px-3 py-1.5 text-[13px] font-semibold shadow-sm backdrop-blur",
            theme.text
          )}
        >
          <span className={cn("h-2 w-2 rounded-full", theme.dot)} />
          {STATUS_LABELS[file.status]}
        </span>

        <span className="absolute right-3 top-3 rounded-full bg-ink-950/70 px-2.5 py-1 text-[12px] font-semibold text-white backdrop-blur">
          {file.side === "listing" ? "Selling" : "Buying"}
        </span>

      </div>

      {/* ── Who and where ─────────────────────────────────────── */}
      <div className="flex flex-1 flex-col p-5">
        <p className="truncate text-[17px] font-semibold leading-snug text-ink-950" title={file.propertyAddress}>
          {file.propertyAddress || file.clientName}
        </p>
        <p className="mt-0.5 truncate text-[15px] text-ink-600">{file.clientName}</p>

        {/* ── Two equal halves ───────────────────────────────── */}
        <div className="mt-4 grid grid-cols-2 divide-x divide-hairline border-t border-hairline pt-4">
          <div className="pr-4">
            <p className="text-[12px] font-semibold uppercase tracking-[0.07em] text-ink-500">
              {file.side === "listing" ? "Price" : "Budget"}
            </p>
            <p className="tnum mt-1 text-[19px] font-semibold tracking-[-0.01em] text-ink-950">
              {file.listPrice > 0 ? `$${file.listPrice.toLocaleString()}` : "—"}
            </p>
          </div>
          <div className="min-w-0 pl-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[12px] font-semibold uppercase tracking-[0.07em] text-ink-500">Next</p>
              {due && <span className={cn("tnum shrink-0 rounded-full px-2 py-0.5 text-[12px] font-semibold", due.tone)}>{due.text}</span>}
            </div>
            <p className="mt-1 line-clamp-2 min-h-[2.7em] text-[15px] font-medium leading-snug text-ink-800" title={next?.title}>
              {next ? next.title : <span className="text-emerald-700">All done</span>}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
