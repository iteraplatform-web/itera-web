"use client";

import { useCallback, useRef, useState } from "react";
import { v4 as uuid } from "uuid";
import { simulateUpload } from "@/lib/files/upload";
import type { UploadItem } from "@/components/ui/upload-progress";

/** Largest file accepted, matching what a real upload endpoint would allow. */
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

/**
 * Runs a batch of files through the upload pipeline two at a time (as a
 * browser would over one connection), reporting progress per file. `store`
 * persists each file once its transfer finishes; if it throws, that file is
 * marked failed and the rest carry on.
 */
export function useUploader<T>(options: {
  kind: UploadItem["kind"];
  accept: (file: File) => string | null;
  store: (file: File) => Promise<T>;
  onBatchDone?: (results: T[]) => void;
}) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const controllers = useRef(new Map<string, AbortController>());
  const optsRef = useRef(options);
  optsRef.current = options;

  const update = (id: string, patch: Partial<UploadItem>) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  const upload = useCallback(async (files: File[]) => {
    const { kind, accept, store, onBatchDone } = optsRef.current;
    const queue = files.map((file) => ({ id: uuid(), file }));

    setItems((prev) => [
      ...prev.filter((p) => p.progress.stage !== "done" && !p.error),
      ...queue.map(({ id, file }) => {
        const problem = file.size > MAX_UPLOAD_BYTES ? "Larger than 25 MB — please compress it first" : accept(file);
        return {
          id,
          name: file.name,
          kind,
          error: problem ?? undefined,
          progress: { stage: "reading" as const, percent: 0, bytesSent: 0, bytesTotal: file.size },
        };
      }),
    ]);

    const valid = queue
      .map((q, order) => ({ ...q, order }))
      .filter(({ file }) => file.size <= MAX_UPLOAD_BYTES && !accept(file));
    // Kept in the order the agent chose them, not the order they finished.
    const results: { order: number; value: T }[] = [];

    const worker = async () => {
      while (valid.length) {
        const next = valid.shift()!;
        const controller = new AbortController();
        controllers.current.set(next.id, controller);
        try {
          await simulateUpload(next.file, (progress) => update(next.id, { progress }), controller.signal);
          results.push({ order: next.order, value: await store(next.file) });
        } catch (err) {
          const cancelled = err instanceof DOMException && err.name === "AbortError";
          update(next.id, { error: cancelled ? "Cancelled" : (err as Error).message || "Upload failed" });
        } finally {
          controllers.current.delete(next.id);
        }
      }
    };

    await Promise.all([worker(), worker()]);
    if (results.length) onBatchDone?.(results.sort((a, b) => a.order - b.order).map((r) => r.value));

    // Clear finished rows after a moment so the list does not pile up.
    setTimeout(() => setItems((prev) => prev.filter((p) => p.progress.stage !== "done")), 4000);
  }, []);

  const cancel = useCallback((id: string) => controllers.current.get(id)?.abort(), []);

  const busy = items.some((i) => !i.error && i.progress.stage !== "done");

  return { items, upload, cancel, busy };
}
