"use client";

import Link from "next/link";
import { BlobImage } from "@/components/ui/blob-image";
import { PropertyPlaceholder } from "@/components/ui/property-placeholder";
import { samplePhotoFor } from "@/lib/work/sample-photos";
import { getMostUrgentTask } from "@/lib/selectors/file-metrics";
import { daysRemaining, isOverdue } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";
import { STATUS_LABELS, type TransactionFile } from "@/types";

/**
 * Photo, address, price, and what's next — mostly ink on white so the eye
 * lands on the facts. Color only when a deadline is late or due today.
 */
export function FileCard({ file }: { file: TransactionFile }) {
  const next = getMostUrgentTask(file);
  const days = next?.dueDate ? daysRemaining(next.dueDate) : null;
  const late = next?.dueDate ? isOverdue(next.dueDate) : false;
  const cover = file.coverPhotoId ? file.photos?.find((p) => p.id === file.coverPhotoId) : undefined;
  const sample = cover ? undefined : samplePhotoFor(file);

  const dueLabel =
    days === null ? null : late ? `${Math.abs(days)}d late` : days === 0 ? "Today" : `${days}d`;
  // Color only when a deadline is pressing — never for status itself.
  const dueTone =
    days === null
      ? null
      : late || days === 0
      ? "text-red-700"
      : days <= 7
      ? "text-amber-700"
      : null;

  return (
    <Link
      href={`/files/${file.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-hairline bg-surface shadow-sm transition-shadow duration-200 hover:shadow-md"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-ink-100">
        {cover ? (
          <BlobImage
            blobKey={cover.thumbBlobId}
            alt={`Photo of ${file.propertyAddress}`}
            className="h-full w-full"
            imgClassName="transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : sample ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={sample}
            alt={`Photo of ${file.propertyAddress}`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <PropertyPlaceholder variant={file.side} />
        )}

        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[12px] font-medium text-ink-800 shadow-sm backdrop-blur">
          {STATUS_LABELS[file.status]}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="truncate text-[17px] font-semibold leading-snug text-ink-950" title={file.propertyAddress}>
          {file.propertyAddress || file.clientName}
        </p>
        <p className="mt-0.5 truncate text-[14px] text-ink-500">
          {file.clientName}
          <span className="text-ink-300"> · </span>
          {file.side === "listing" ? "Selling" : "Buying"}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-hairline pt-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-ink-400">
              {file.side === "listing" ? "Price" : "Budget"}
            </p>
            <p className="tnum mt-1 text-[18px] font-semibold tracking-[-0.01em] text-ink-950">
              {file.listPrice > 0 ? `$${file.listPrice.toLocaleString()}` : "—"}
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-ink-400">
              Next
              {dueLabel && (
                <span className={cn("ml-1.5 normal-case tracking-normal", dueTone ? `font-semibold ${dueTone}` : "text-ink-400")}>
                  {dueLabel}
                </span>
              )}
            </p>
            <p className="mt-1 line-clamp-2 min-h-[2.5em] text-[14px] leading-snug text-ink-700" title={next?.title}>
              {next ? next.title : "All caught up"}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
