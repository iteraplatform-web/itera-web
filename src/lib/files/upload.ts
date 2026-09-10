/**
 * Moves a file through the same stages a real upload goes through, with
 * progress driven by the file's actual size rather than a fixed timer:
 *
 *   reading     – bytes read off disk (real FileReader progress events)
 *   uploading   – transfer at a realistic, slightly varying connection speed
 *   processing  – server-side work (virus scan, rename, thumbnail)
 *
 * A 200KB PDF finishes in well under a second; a 9MB photo takes a few. When
 * the real backend exists, only `transfer` changes — the UI does not.
 */

export type UploadStage = "reading" | "uploading" | "processing" | "done";

export interface UploadProgress {
  stage: UploadStage;
  /** 0–100 across all stages combined. */
  percent: number;
  bytesSent: number;
  bytesTotal: number;
  /** Seconds remaining at the current rate, once it can be estimated. */
  etaSeconds?: number;
}

/** Typical home/office uplink, in bytes per second. */
const BASE_THROUGHPUT = 3.2 * 1024 * 1024;

function readFully(file: File, onProgress: (loaded: number) => void, signal?: AbortSignal): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onprogress = (e) => onProgress(e.loaded);
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error ?? new Error("Could not read the file"));
    signal?.addEventListener("abort", () => {
      reader.abort();
      reject(new DOMException("Upload cancelled", "AbortError"));
    });
    reader.readAsArrayBuffer(file);
  });
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(t);
      reject(new DOMException("Upload cancelled", "AbortError"));
    });
  });
}

export async function simulateUpload(
  file: File,
  onProgress: (p: UploadProgress) => void,
  signal?: AbortSignal
): Promise<void> {
  const total = Math.max(file.size, 1);

  // Stage 1: reading — 0 to 10%
  await readFully(
    file,
    (loaded) =>
      onProgress({ stage: "reading", percent: (loaded / total) * 10, bytesSent: 0, bytesTotal: total }),
    signal
  );

  // Stage 2: transfer — 10 to 90%, in ~120ms ticks at a jittered throughput
  let sent = 0;
  const started = performance.now();
  while (sent < total) {
    await sleep(120, signal);
    const jitter = 0.65 + Math.random() * 0.7;
    sent = Math.min(total, sent + BASE_THROUGHPUT * 0.12 * jitter);
    const elapsed = (performance.now() - started) / 1000;
    const rate = sent / Math.max(elapsed, 0.001);
    onProgress({
      stage: "uploading",
      percent: 10 + (sent / total) * 80,
      bytesSent: sent,
      bytesTotal: total,
      etaSeconds: sent < total ? (total - sent) / rate : 0,
    });
  }

  // Stage 3: processing — scales gently with size, capped
  const processingMs = Math.min(1400, 350 + total / 20000);
  const steps = 6;
  for (let i = 1; i <= steps; i++) {
    await sleep(processingMs / steps, signal);
    onProgress({ stage: "processing", percent: 90 + (i / steps) * 10, bytesSent: total, bytesTotal: total });
  }

  onProgress({ stage: "done", percent: 100, bytesSent: total, bytesTotal: total });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const STAGE_LABELS: Record<UploadStage, string> = {
  reading: "Reading file",
  uploading: "Uploading",
  processing: "Checking and renaming",
  done: "Done",
};
