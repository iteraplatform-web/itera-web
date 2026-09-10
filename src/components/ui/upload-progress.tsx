"use client";

import { CheckCircle2, FileText, Image as ImageIcon, X } from "lucide-react";
import { formatBytes, STAGE_LABELS, type UploadProgress } from "@/lib/files/upload";
import { cn } from "@/lib/utils/cn";

export interface UploadItem {
  id: string;
  name: string;
  kind: "image" | "document";
  progress: UploadProgress;
  error?: string;
}

/** One row per file in flight: name, stage, bytes, time left, and cancel. */
export function UploadProgressList({
  items,
  onCancel,
}: {
  items: UploadItem[];
  onCancel?: (id: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <ul className="space-y-2" aria-live="polite">
      {items.map((item) => {
        const { progress } = item;
        const done = progress.stage === "done";
        const Icon = item.kind === "image" ? ImageIcon : FileText;
        return (
          <li
            key={item.id}
            className={cn(
              "rounded-xl border px-4 py-3",
              item.error ? "border-red-200 bg-red-50" : done ? "border-emerald-200 bg-emerald-50/60" : "border-hairline bg-surface"
            )}
          >
            <div className="flex items-center gap-3">
              {done ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
              ) : (
                <Icon className="h-5 w-5 shrink-0 text-ink-500" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold text-ink-900">{item.name}</p>
                <p className={cn("text-[13px]", item.error ? "text-red-700" : "text-ink-500")}>
                  {item.error
                    ? item.error
                    : done
                    ? `Uploaded · ${formatBytes(progress.bytesTotal)}`
                    : progress.stage === "uploading"
                    ? `${STAGE_LABELS.uploading} ${formatBytes(progress.bytesSent)} of ${formatBytes(progress.bytesTotal)}${
                        progress.etaSeconds && progress.etaSeconds > 0.5 ? ` · about ${Math.ceil(progress.etaSeconds)}s left` : ""
                      }`
                    : STAGE_LABELS[progress.stage]}
                </p>
              </div>
              <span className="tnum shrink-0 text-[14px] font-semibold text-ink-700">{Math.round(progress.percent)}%</span>
              {!done && !item.error && onCancel && (
                <button
                  onClick={() => onCancel(item.id)}
                  className="shrink-0 rounded-lg p-1.5 text-ink-500 hover:bg-ink-100 hover:text-ink-900"
                  aria-label={`Cancel ${item.name}`}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {!done && !item.error && (
              <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-ink-100">
                <div
                  className={cn(
                    "h-full rounded-full transition-[width] duration-150 ease-linear",
                    progress.stage === "processing" ? "bg-amber-500" : "bg-itera-600"
                  )}
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
