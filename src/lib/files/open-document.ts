import { format, parseISO } from "date-fns";
import { getBlob } from "@/lib/files/blob-store";
import { makePlaceholderPdf } from "@/lib/files/placeholder-pdf";
import type { Document, TransactionFile } from "@/types";

/**
 * Opens a received document in a new tab. Uploaded files open as uploaded;
 * documents that came with the sample data get a generated PDF carrying the
 * file's real details, so "View" never leads nowhere.
 *
 * The tab is opened synchronously inside the click, before any await —
 * otherwise browsers treat it as an unrequested pop-up and block it.
 */
export async function openDocument(doc: Document, file: TransactionFile): Promise<void> {
  const tab = window.open("", "_blank");
  let blob: Blob | undefined;
  if (doc.blobId) blob = await getBlob(doc.blobId);
  if (!blob) {
    blob = makePlaceholderPdf(doc.name, [
      `Property: ${file.propertyAddress}`,
      `Client: ${file.clientName}`,
      `File name: ${doc.fileName}`,
      `Received: ${doc.receivedAt ? format(parseISO(doc.receivedAt), "MMMM d, yyyy") : "-"}`,
      `Received by: ${doc.receivedBy ?? "-"}`,
      "",
      "Paper copy on file. This page stands in for the scanned original.",
    ]);
  }
  const url = URL.createObjectURL(blob);
  if (tab) tab.location.href = url;
  else window.location.href = url;
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export async function downloadDocument(doc: Document, file: TransactionFile): Promise<void> {
  let blob: Blob | undefined;
  if (doc.blobId) blob = await getBlob(doc.blobId);
  if (!blob) blob = makePlaceholderPdf(doc.name, [`Property: ${file.propertyAddress}`, `Client: ${file.clientName}`]);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = doc.fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Accepted paperwork formats, as a real document endpoint would allow. */
export const DOCUMENT_ACCEPT = ".pdf,.doc,.docx,.jpg,.jpeg,.png,.heic,application/pdf,image/*";

export function rejectNonDocument(f: File): string | null {
  const ok = /\.(pdf|docx?|jpe?g|png|heic)$/i.test(f.name) || f.type === "application/pdf" || f.type.startsWith("image/");
  return ok ? null : "Use a PDF, Word document, or photo of the page";
}

/**
 * Guesses which outstanding document an uploaded file is, from its name —
 * "Chen listing agreement SIGNED.pdf" → Listing Agreement. Offered as a
 * suggestion the agent confirms, never applied silently.
 */
export function suggestDocumentMatch(fileName: string, candidates: Document[]): Document | undefined {
  const clean = fileName.toLowerCase().replace(/\.[a-z0-9]+$/, "").replace(/[_\-.]+/g, " ");
  let best: { doc: Document; score: number } | undefined;
  for (const doc of candidates) {
    const words = doc.name.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 2);
    const hits = words.filter((w) => clean.includes(w)).length;
    const score = words.length ? hits / words.length : 0;
    if (score > 0.5 && (!best || score > best.score)) best = { doc, score };
  }
  return best?.doc;
}
